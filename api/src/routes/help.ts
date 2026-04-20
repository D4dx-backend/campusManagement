import express from 'express';
import { HelpCategory } from '../models/HelpCategory';
import { HelpArticle } from '../models/HelpArticle';
import { Organization } from '../models/Organization';
import { Branch } from '../models/Branch';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';
import { resolveEnabledFeatures } from '../middleware/featureAccess';
import { FEATURE_KEYS } from '../config/featureRegistry';
import Joi from 'joi';

const router = express.Router();
router.use(authenticate);

/**
 * Resolve which feature keys are enabled for the current user.
 * Platform admins get all features.
 */
async function getUserEnabledFeatures(req: AuthenticatedRequest): Promise<Set<string>> {
  if (req.user?.role === 'platform_admin') {
    return new Set(FEATURE_KEYS as readonly string[]);
  }

  const orgId = req.user?.organizationId;
  if (!orgId) return new Set(FEATURE_KEYS as readonly string[]);

  const org = await Organization.findById(orgId).select('enabledFeatures').lean();
  if (!org) return new Set();

  let branchFeatures: string[] | undefined;
  const branchId = req.user?.branchId;
  if (branchId) {
    const branch = await Branch.findById(branchId).select('enabledFeatures').lean();
    branchFeatures = branch?.enabledFeatures as string[] | undefined;
  }

  return resolveEnabledFeatures(
    (org as any).enabledFeatures as string[] | undefined,
    branchFeatures
  );
}

/**
 * Build a role filter for articles visible to the current user.
 * Articles with empty roles array are visible to all.
 */
function getRoleFilter(role: string) {
  return { $or: [{ roles: { $size: 0 } }, { roles: role }] };
}

// GET /api/help/categories
const categoryQuerySchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').optional()
});

router.get('/categories', validateQuery(categoryQuerySchema), async (req: AuthenticatedRequest, res) => {
  const enabledFeatures = await getUserEnabledFeatures(req);

  const filter: any = { status: 'active' };

  const categories = await HelpCategory.find(filter).sort({ order: 1 }).lean();

  // Filter by features: include categories with no featureKey, or whose featureKey is enabled
  const visible = categories.filter(
    (cat) => !cat.featureKey || enabledFeatures.has(cat.featureKey)
  );

  // Add article counts
  const role = req.user?.role || 'student';
  const catIds = visible.map((c) => c._id);
  const counts = await HelpArticle.aggregate([
    {
      $match: {
        categoryId: { $in: catIds },
        status: 'published',
        ...getRoleFilter(role)
      }
    },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } }
  ]);

  const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.count]));

  const result = visible.map((cat) => ({
    ...cat,
    articleCount: countMap.get(cat._id.toString()) || 0
  }));

  res.json({ success: true, data: result });
});

// GET /api/help/articles
const articleQuerySchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v, 10))).default(1),
  limit: Joi.alternatives().try(Joi.number().integer().min(1).max(100), Joi.string().pattern(/^\d+$/).custom(v => Math.min(parseInt(v, 10), 100))).default(20),
  search: Joi.string().optional().allow(''),
  categoryId: Joi.string().optional().allow(''),
  module: Joi.string().optional().allow(''),
  route: Joi.string().optional().allow('')
});

router.get('/articles', validateQuery(articleQuerySchema), async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, search, categoryId, module, route } = req.query as any;
  const enabledFeatures = await getUserEnabledFeatures(req);
  const role = req.user?.role || 'student';

  const filter: any = {
    status: 'published',
    ...getRoleFilter(role)
  };

  // Feature filter: articles with no featureKey or enabled featureKey
  const enabledArr = Array.from(enabledFeatures);
  filter.$and = filter.$and || [];
  filter.$and.push({
    $or: [
      { featureKey: null },
      { featureKey: { $in: enabledArr } }
    ]
  });

  if (categoryId) filter.categoryId = categoryId;
  if (module) filter.module = module;
  if (route) filter.relatedRoutes = route;

  let sortOptions: any = { order: 1 };

  if (search) {
    filter.$text = { $search: search };
    sortOptions = { score: { $meta: 'textScore' }, order: 1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [articles, total] = await Promise.all([
    search
      ? HelpArticle.find(filter, { score: { $meta: 'textScore' } })
          .populate('categoryId', 'name slug icon')
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit))
          .lean()
      : HelpArticle.find(filter)
          .populate('categoryId', 'name slug icon')
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
    HelpArticle.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: articles,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// GET /api/help/articles/:slug
router.get('/articles/:slug', async (req: AuthenticatedRequest, res) => {
  const { slug } = req.params;
  const enabledFeatures = await getUserEnabledFeatures(req);
  const role = req.user?.role || 'student';

  const article = await HelpArticle.findOne({ slug, status: 'published' })
    .populate('categoryId', 'name slug icon')
    .lean();

  if (!article) {
    res.status(404).json({ success: false, message: 'Help article was not found.' });
    return;
  }

  // Check feature access
  if (article.featureKey && !enabledFeatures.has(article.featureKey)) {
    res.status(404).json({ success: false, message: 'Help article was not found.' });
    return;
  }

  // Check role access
  if (article.roles.length > 0 && !article.roles.includes(role)) {
    res.status(404).json({ success: false, message: 'Help article was not found.' });
    return;
  }

  res.json({ success: true, data: article });
});

// GET /api/help/contextual?route=/students
const contextualQuerySchema = Joi.object({
  route: Joi.string().required()
});

router.get('/contextual', validateQuery(contextualQuerySchema), async (req: AuthenticatedRequest, res) => {
  const { route } = req.query as any;
  const enabledFeatures = await getUserEnabledFeatures(req);
  const role = req.user?.role || 'student';

  const enabledArr = Array.from(enabledFeatures);

  const filter: any = {
    status: 'published',
    relatedRoutes: route,
    ...getRoleFilter(role),
    $or: [
      { featureKey: null },
      { featureKey: { $in: enabledArr } }
    ]
  };

  const articles = await HelpArticle.find(filter)
    .populate('categoryId', 'name slug icon')
    .sort({ order: 1 })
    .limit(10)
    .lean();

  res.json({ success: true, data: articles });
});

export default router;
