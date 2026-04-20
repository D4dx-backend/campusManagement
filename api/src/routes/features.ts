import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { Organization } from '../models/Organization';
import { Branch } from '../models/Branch';
import { FEATURE_KEYS, FEATURE_REGISTRY, FeatureKey } from '../config/featureRegistry';
import { resolveEnabledFeatures } from '../middleware/featureAccess';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

router.use(authenticate);

// ──────────────────────────────────────
// GET /api/features/registry
// Returns the full feature registry (for settings UI)
// Accessible to: platform_admin, org_admin
// ──────────────────────────────────────
router.get(
  '/registry',
  authorize('platform_admin', 'org_admin'),
  async (_req: AuthenticatedRequest, res) => {
    const registry = Object.values(FEATURE_REGISTRY).map(({ key, label, description, modules }) => ({
      key,
      label,
      description,
      modules,
    }));
    res.json({ success: true, data: registry });
  }
);

// ──────────────────────────────────────
// GET /api/features/organization/:organizationId
// Get org's enabled features
// ──────────────────────────────────────
router.get(
  '/organization/:organizationId',
  authorize('platform_admin', 'org_admin'),
  async (req: AuthenticatedRequest, res) => {
    const org = await Organization.findById(req.params.organizationId).select('enabledFeatures name').lean();
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    // empty/undefined → all features
    const enabledFeatures = (!org.enabledFeatures || org.enabledFeatures.length === 0)
      ? [...FEATURE_KEYS]
      : org.enabledFeatures;

    res.json({
      success: true,
      data: {
        organizationId: org._id,
        organizationName: org.name,
        enabledFeatures,
        allFeatures: [...FEATURE_KEYS],
      },
    });
  }
);

// ──────────────────────────────────────
// PUT /api/features/organization/:organizationId
// Update org's enabled features
// Platform admin only
// ──────────────────────────────────────
router.put(
  '/organization/:organizationId',
  authorize('platform_admin'),
  async (req: AuthenticatedRequest, res) => {
    const { enabledFeatures } = req.body;

    if (!Array.isArray(enabledFeatures)) {
      res.status(400).json({ success: false, message: 'enabledFeatures must be an array' });
      return;
    }

    // Validate all keys
    const validKeys = new Set<string>(FEATURE_KEYS as readonly string[]);
    const invalid = enabledFeatures.filter((k: string) => !validKeys.has(k));
    if (invalid.length > 0) {
      res.status(400).json({ success: false, message: `Invalid feature keys: ${invalid.join(', ')}` });
      return;
    }

    const org = await Organization.findByIdAndUpdate(
      req.params.organizationId,
      { enabledFeatures },
      { new: true, runValidators: true }
    ).select('enabledFeatures name');

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    // Also prune branch features that are no longer in the org set
    const orgSet = new Set(enabledFeatures);
    const branches = await Branch.find({ organizationId: org._id }).select('enabledFeatures');
    for (const branch of branches) {
      if (branch.enabledFeatures && branch.enabledFeatures.length > 0) {
        const pruned = (branch.enabledFeatures as string[]).filter((f) => orgSet.has(f));
        if (pruned.length !== branch.enabledFeatures.length) {
          branch.enabledFeatures = pruned as any;
          await branch.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Organization features updated',
      data: { enabledFeatures: org.enabledFeatures },
    });
  }
);

// ──────────────────────────────────────
// GET /api/features/branch/:branchId
// Get branch's enabled features (resolved)
// ──────────────────────────────────────
router.get(
  '/branch/:branchId',
  authorize('platform_admin', 'org_admin', 'branch_admin'),
  async (req: AuthenticatedRequest, res) => {
    const branch = await Branch.findById(req.params.branchId).select('enabledFeatures organizationId name').lean();
    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }

    const org = await Organization.findById(branch.organizationId).select('enabledFeatures').lean();

    const orgFeatures = (org?.enabledFeatures as string[] | undefined);
    const branchFeatures = (branch.enabledFeatures as string[] | undefined);

    // Available = what the org allows
    const orgEnabled = (!orgFeatures || orgFeatures.length === 0)
      ? [...FEATURE_KEYS]
      : orgFeatures;

    // Effective = intersection of org + branch (or org if branch doesn't override)
    const effective = [...resolveEnabledFeatures(orgFeatures, branchFeatures)];

    // Explicit = what the branch has explicitly set (may be empty = inherit all)
    const explicit = (branchFeatures && branchFeatures.length > 0) ? branchFeatures : null;

    res.json({
      success: true,
      data: {
        branchId: branch._id,
        branchName: branch.name,
        orgEnabledFeatures: orgEnabled,
        branchEnabledFeatures: explicit,
        effectiveFeatures: effective,
      },
    });
  }
);

// ──────────────────────────────────────
// PUT /api/features/branch/:branchId
// Update branch's enabled features
// Org admin only
// ──────────────────────────────────────
router.put(
  '/branch/:branchId',
  authorize('platform_admin', 'org_admin'),
  async (req: AuthenticatedRequest, res) => {
    const { enabledFeatures } = req.body;

    if (!Array.isArray(enabledFeatures)) {
      res.status(400).json({ success: false, message: 'enabledFeatures must be an array' });
      return;
    }

    const branch = await Branch.findById(req.params.branchId);
    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }

    // Validate keys exist
    const validKeys = new Set<string>(FEATURE_KEYS as readonly string[]);
    const invalid = enabledFeatures.filter((k: string) => !validKeys.has(k));
    if (invalid.length > 0) {
      res.status(400).json({ success: false, message: `Invalid feature keys: ${invalid.join(', ')}` });
      return;
    }

    // Ensure all requested features are enabled at org level
    const org = await Organization.findById(branch.organizationId).select('enabledFeatures').lean();
    const orgEnabled = (!org?.enabledFeatures || (org.enabledFeatures as string[]).length === 0)
      ? new Set<string>(FEATURE_KEYS as readonly string[])
      : new Set<string>(org.enabledFeatures as string[]);

    const notAllowed = enabledFeatures.filter((k: string) => !orgEnabled.has(k));
    if (notAllowed.length > 0) {
      res.status(400).json({
        success: false,
        message: `These features are not enabled at organization level: ${notAllowed.join(', ')}`,
      });
      return;
    }

    branch.enabledFeatures = enabledFeatures;
    await branch.save();

    res.json({
      success: true,
      message: 'Branch features updated',
      data: { enabledFeatures: branch.enabledFeatures },
    });
  }
);

// ──────────────────────────────────────
// GET /api/features/effective
// Get effective features for the current user's context
// Used by frontend to filter sidebar / UI
// ──────────────────────────────────────
router.get('/effective', async (req: AuthenticatedRequest, res) => {
  // Platform admin gets everything
  if (req.user?.role === 'platform_admin') {
    res.json({ success: true, data: { enabledFeatures: [...FEATURE_KEYS] } });
    return;
  }

  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.json({ success: true, data: { enabledFeatures: [...FEATURE_KEYS] } });
    return;
  }

  const org = await Organization.findById(orgId).select('enabledFeatures').lean();

  let branchFeatures: string[] | undefined;
  const branchId = req.user?.branchId || (req.query.branchId as string);
  if (branchId) {
    const branch = await Branch.findById(branchId).select('enabledFeatures').lean();
    branchFeatures = branch?.enabledFeatures as string[] | undefined;
  }

  const effective = [...resolveEnabledFeatures(
    org?.enabledFeatures as string[] | undefined,
    branchFeatures
  )];

  res.json({ success: true, data: { enabledFeatures: effective } });
});

export default router;
