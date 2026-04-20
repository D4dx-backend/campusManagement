import express, { Response } from 'express';
import Joi from 'joi';
import { DomainMapping } from '../models/DomainMapping';
import { Organization } from '../models/Organization';
import { authenticate, authorize } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { ActivityLog } from '../models/ActivityLog';

const router = express.Router();

// ─── VALIDATION ──────────────────────────────────────────────────────
const domainRegex = /^(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const createDomainSchema = Joi.object({
  domain: Joi.string().required().trim().lowercase().pattern(domainRegex).message('Invalid domain format'),
  domainType: Joi.string().valid('subdomain', 'custom').required(),
  organizationId: Joi.string().required(),
  isPrimary: Joi.boolean().default(false),
});

const updateDomainSchema = Joi.object({
  isPrimary: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive'),
});

// ─── PUBLIC: Resolve domain → organization branding ──────────────────
// This does NOT require authentication – the login page calls it
router.get('/resolve', async (req: express.Request, res: Response) => {
  const { domain } = req.query;
  if (!domain || typeof domain !== 'string') {
    res.status(400).json({ success: false, message: 'Please provide a domain to look up.' });
    return;
  }

  const mapping = await DomainMapping.findOne({
    domain: domain.toLowerCase().trim(),
    status: 'active',
  });

  if (!mapping) {
    // Return default/platform branding
    res.json({
      success: true,
      data: {
        resolved: false,
        organizationId: null,
        organizationName: 'CampusWise',
        organizationLogo: null,
        tagline: 'Institution Management System',
      },
    });
    return;
  }

  const org = await Organization.findById(mapping.organizationId).select(
    'name logo code address phone email website'
  );

  if (!org || org.status === 'inactive') {
    res.json({
      success: true,
      data: {
        resolved: false,
        organizationId: null,
        organizationName: 'CampusWise',
        organizationLogo: null,
        tagline: 'Institution Management System',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      resolved: true,
      organizationId: org._id,
      organizationName: org.name,
      organizationLogo: org.logo || null,
      organizationCode: org.code,
      tagline: org.website || '',
    },
  });
});

// ─── GET domains for an organization ────────────────────────────────
router.get(
  '/',
  authenticate,
  authorize('platform_admin', 'org_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const query: any = {};

    if (req.user!.role === 'org_admin') {
      query.organizationId = req.user!.organizationId;
    } else if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }

    const domains = await DomainMapping.find(query)
      .populate('organizationId', 'name code logo')
      .sort({ isPrimary: -1, createdAt: -1 });

    res.json({ success: true, data: domains });
  }
);

// ─── CREATE domain mapping ──────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('platform_admin', 'org_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = createDomainSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    // org_admin can only create for their own org
    if (req.user!.role === 'org_admin') {
      value.organizationId = req.user!.organizationId;
    }

    // Verify organization exists
    const org = await Organization.findById(value.organizationId);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization was not found.' });
      return;
    }

    // Check duplicate domain
    const existing = await DomainMapping.findOne({ domain: value.domain });
    if (existing) {
      res.status(400).json({ success: false, message: 'This domain is already mapped to an organization' });
      return;
    }

    // If isPrimary, unset other primaries for this org
    if (value.isPrimary) {
      await DomainMapping.updateMany(
        { organizationId: value.organizationId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const domain = await DomainMapping.create({
      ...value,
      createdBy: req.user!._id,
    });

    await ActivityLog.create({
      action: 'create',
      module: 'domain-mapping',
      details: `Domain "${value.domain}" mapped to organization "${org.name}"`,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      organizationId: value.organizationId,
    });

    res.status(201).json({ success: true, data: domain });
  }
);

// ─── UPDATE domain mapping ──────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  authorize('platform_admin', 'org_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = updateDomainSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const domain = await DomainMapping.findById(req.params.id);
    if (!domain) {
      res.status(404).json({ success: false, message: 'Domain mapping was not found.' });
      return;
    }

    // org_admin can only update their own org's domains
    if (
      req.user!.role === 'org_admin' &&
      domain.organizationId.toString() !== req.user!.organizationId?.toString()
    ) {
      res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
      return;
    }

    // If setting as primary, unset others
    if (value.isPrimary) {
      await DomainMapping.updateMany(
        { organizationId: domain.organizationId, isPrimary: true, _id: { $ne: domain._id } },
        { isPrimary: false }
      );
    }

    Object.assign(domain, value);
    await domain.save();

    await ActivityLog.create({
      action: 'update',
      module: 'domain-mapping',
      details: `Domain mapping "${domain.domain}" updated`,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      organizationId: domain.organizationId,
    });

    res.json({ success: true, data: domain });
  }
);

// ─── DELETE domain mapping ──────────────────────────────────────────
router.delete(
  '/:id',
  authenticate,
  authorize('platform_admin', 'org_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const domain = await DomainMapping.findById(req.params.id);
    if (!domain) {
      res.status(404).json({ success: false, message: 'Domain mapping was not found.' });
      return;
    }

    if (
      req.user!.role === 'org_admin' &&
      domain.organizationId.toString() !== req.user!.organizationId?.toString()
    ) {
      res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
      return;
    }

    await DomainMapping.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      action: 'delete',
      module: 'domain-mapping',
      details: `Domain mapping "${domain.domain}" removed`,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      organizationId: domain.organizationId,
    });

    res.json({ success: true, message: 'Domain mapping deleted' });
  }
);

// ─── VERIFY domain (DNS check) ─────────────────────────────────────
router.post(
  '/:id/verify',
  authenticate,
  authorize('platform_admin', 'org_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const domain = await DomainMapping.findById(req.params.id);
    if (!domain) {
      res.status(404).json({ success: false, message: 'Domain mapping was not found.' });
      return;
    }

    if (
      req.user!.role === 'org_admin' &&
      domain.organizationId.toString() !== req.user!.organizationId?.toString()
    ) {
      res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
      return;
    }

    // Attempt DNS resolution check
    try {
      const dns = await import('dns');
      const { promisify } = await import('util');
      const resolve = promisify(dns.resolve);

      await resolve(domain.domain);

      domain.status = 'active';
      domain.sslStatus = 'active';
      domain.verifiedAt = new Date();
      await domain.save();

      res.json({
        success: true,
        message: 'Domain verified successfully',
        data: domain,
      });
    } catch (err: any) {
      domain.status = 'pending_verification';
      domain.sslStatus = 'pending';
      await domain.save();

      res.json({
        success: false,
        message: 'Domain DNS verification failed. Please ensure the domain is pointed correctly.',
        data: domain,
      });
    }
  }
);

export default router;
