import express, { Response } from 'express';
import { Organization } from '../models/Organization';
import { authenticate, authorize } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { ActivityLog } from '../models/ActivityLog';

const router = express.Router();

// Get all organizations (platform_admin only)
router.get('/', authenticate, authorize('platform_admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 10, search, status } = req.query;
  const query: any = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [organizations, total] = await Promise.all([
    Organization.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Organization.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: organizations,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get single organization
// Get current user's organization (any authenticated user)
router.get('/my-organization', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user!.organizationId) {
    res.status(404).json({ success: false, message: 'No organization associated with this user' });
    return;
  }
  const organization = await Organization.findById(req.user!.organizationId).select(
    'name code address phone email website logo status currency currencySymbol'
  );
  if (!organization) {
    res.status(404).json({ success: false, message: 'Organization not found' });
    return;
  }
  res.json({ success: true, data: organization });
});

// Get single organization
router.get('/:id', authenticate, authorize('platform_admin', 'org_admin'), async (req: AuthenticatedRequest, res: Response) => {
  const organization = await Organization.findById(req.params.id);
  if (!organization) {
    res.status(404).json({ success: false, message: 'Organization not found' });
    return;
  }

  // org_admin can only see their own organization
  if (req.user!.role === 'org_admin' && req.user!.organizationId?.toString() !== (organization._id as any).toString()) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }

  res.json({ success: true, data: organization });
});

// Create organization (platform_admin only)
router.post('/', authenticate, authorize('platform_admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { name, code, address, phone, email, website, logo, subscriptionPlan, maxBranches,
    taxId, taxLabel, currency, currencySymbol, country, state, city, pincode,
    registrationNumber, footerText } = req.body;

  // Check for duplicate code or email
  const existingOrg = await Organization.findOne({
    $or: [
      { code: code?.toUpperCase() },
      { email: email?.toLowerCase() }
    ]
  });

  if (existingOrg) {
    const field = existingOrg.code === code?.toUpperCase() ? 'code' : 'email';
    res.status(400).json({
      success: false,
      message: `Organization with this ${field} already exists`
    });
    return;
  }

  const organization = await Organization.create({
    name,
    code,
    address,
    phone,
    email,
    website,
    logo,
    subscriptionPlan,
    maxBranches,
    taxId, taxLabel, currency, currencySymbol, country, state, city, pincode,
    registrationNumber, footerText,
    createdBy: req.user!._id
  });

  // Log activity
  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'create',
    module: 'organizations',
    details: `Created organization: ${name} (${code})`,
    ipAddress: req.ip
  });

  res.status(201).json({ success: true, data: organization, message: 'Organization created successfully' });
});

// Update organization
router.put('/:id', authenticate, authorize('platform_admin', 'org_admin'), async (req: AuthenticatedRequest, res: Response) => {
  const organization = await Organization.findById(req.params.id);
  if (!organization) {
    res.status(404).json({ success: false, message: 'Organization not found' });
    return;
  }

  // org_admin can only update their own organization
  if (req.user!.role === 'org_admin' && req.user!.organizationId?.toString() !== (organization._id as any).toString()) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }

  const { name, code, address, phone, email, website, logo, status, subscriptionPlan, maxBranches,
    taxId, taxLabel, currency, currencySymbol, country, state, city, pincode,
    registrationNumber, footerText } = req.body;

  // Check for duplicate code or email (exclude current)
  if (code || email) {
    const duplicateQuery: any[] = [];
    if (code) duplicateQuery.push({ code: code.toUpperCase() });
    if (email) duplicateQuery.push({ email: email.toLowerCase() });

    const existing = await Organization.findOne({
      _id: { $ne: req.params.id },
      $or: duplicateQuery
    });

    if (existing) {
      const field = existing.code === code?.toUpperCase() ? 'code' : 'email';
      res.status(400).json({
        success: false,
        message: `Organization with this ${field} already exists`
      });
      return;
    }
  }

  // org_admin cannot change status or subscription
  const updateData: any = { name, code, address, phone, email, website, logo,
    taxId, taxLabel, currency, currencySymbol, country, state, city, pincode,
    registrationNumber, footerText };
  if (req.user!.role === 'platform_admin') {
    updateData.status = status;
    updateData.subscriptionPlan = subscriptionPlan;
    updateData.maxBranches = maxBranches;
  }

  // Remove undefined fields
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  const updated = await Organization.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'update',
    module: 'organizations',
    details: `Updated organization: ${updated!.name}`,
    ipAddress: req.ip,
    organizationId: organization._id
  });

  res.json({ success: true, data: updated, message: 'Organization updated successfully' });
});

// Delete organization (platform_admin only)
router.delete('/:id', authenticate, authorize('platform_admin'), async (req: AuthenticatedRequest, res: Response) => {
  const organization = await Organization.findById(req.params.id);
  if (!organization) {
    res.status(404).json({ success: false, message: 'Organization not found' });
    return;
  }

  await Organization.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'delete',
    module: 'organizations',
    details: `Deleted organization: ${organization.name} (${organization.code})`,
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Organization deleted successfully' });
});

export default router;
