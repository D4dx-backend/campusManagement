import express from 'express';
import { randomBytes } from 'crypto';
import { FeePayment } from '../models/FeePayment';
import { Student } from '../models/Student';
import { AcademicYear } from '../models/AcademicYear';
import { ActivityLog } from '../models/ActivityLog';
import { Organization } from '../models/Organization';
import { Branch } from '../models/Branch';
import { authenticate, checkPermission } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { sendFeeReceiptEmail, sendFeeReceiptWhatsApp } from '../utils/notificationService';
import { resolveSettings } from '../utils/resolveSettings';

import { getOrgBranchFilter } from '../utils/orgFilter';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

const generateReference = (prefix: string) => {
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${Date.now()}${suffix}`;
};

const roundCurrency = (amount: number) => Number(amount.toFixed(3));

const getPaymentAccessError = (req: AuthenticatedRequest, payment: any) => {
  if (req.user!.role === 'org_admin' && payment.organizationId?.toString() !== req.user!.organizationId?.toString()) {
    return 'Access denied to this payment record';
  }

  if (!['platform_admin', 'org_admin'].includes(req.user!.role) && req.user!.branchId?.toString() !== payment.branchId?.toString()) {
    return 'Access denied to this payment record';
  }

  return null;
};

const getEditablePaymentSnapshot = (payment: any) => ({
  paymentMethod: payment.paymentMethod,
  paymentDate: new Date(payment.paymentDate),
  remarks: payment.remarks || undefined,
  academicYear: payment.academicYear || undefined,
  feeMonth: payment.feeMonth || undefined,
});

const normalizeEditablePaymentSnapshot = (snapshot: ReturnType<typeof getEditablePaymentSnapshot>) => ({
  paymentMethod: snapshot.paymentMethod,
  paymentDate: new Date(snapshot.paymentDate).toISOString(),
  remarks: snapshot.remarks || '',
  academicYear: snapshot.academicYear || '',
  feeMonth: snapshot.feeMonth || '',
});

const createFeePaymentRecord = async ({
  req,
  student,
  feeItems,
  paymentMethod,
  remarks,
  academicYear,
  feeMonth
}: {
  req: AuthenticatedRequest;
  student: any;
  feeItems: Array<any>;
  paymentMethod: 'cash' | 'bank' | 'online';
  remarks?: string;
  academicYear?: string;
  feeMonth?: string;
}) => {
  const totalAmount = roundCurrency(
    feeItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
  );

  const feePayment = new FeePayment({
    receiptNo: generateReference('REC'),
    transactionId: generateReference('TXN'),
    studentId: student._id,
    studentName: student.name,
    classId: student.classId,
    className: student.class,
    feeItems,
    totalAmount,
    paymentDate: new Date(),
    paymentMethod,
    status: 'paid',
    remarks,
    academicYear,
    feeMonth,
    organizationId: req.user!.organizationId,
    branchId: req.user!.branchId || student.branchId,
    createdBy: req.user!._id
  });

  await feePayment.save();

  const [branch, org] = await Promise.all([
    Branch.findById(feePayment.branchId).lean(),
    Organization.findById(feePayment.organizationId).lean()
  ]);

  if (org) {
    const settings = resolveSettings(org, branch);
    const currencyLabel = settings.currencySymbol || settings.currency || 'BHD';
    const notificationData = {
      receiptNo: feePayment.receiptNo,
      studentName: student.name,
      class: student.class,
      feeItems: feePayment.feeItems || [],
      totalAmount: feePayment.totalAmount || 0,
      paymentDate: feePayment.paymentDate,
      paymentMethod: feePayment.paymentMethod,
      institutionName: settings.name,
      guardianEmail: student.guardianEmail,
      guardianPhone: student.guardianPhone || '',
      currency: settings.currency,
      currencySymbol: settings.currencySymbol || settings.currency,
    };

    Promise.all([
      sendFeeReceiptEmail(notificationData),
      sendFeeReceiptWhatsApp(notificationData)
    ]).catch(error => {
      console.error('Notification sending error:', error);
    });
  }

  const feeDetails = feeItems
    .map((item: any) => `${item.title}: ${(branch as any)?.currencySymbol || (org as any)?.currencySymbol || (branch as any)?.currency || (org as any)?.currency || 'BHD'} ${roundCurrency(item.amount || 0).toFixed(3)}`)
    .join(', ');

  const currencyLabel = (branch as any)?.currencySymbol || (org as any)?.currencySymbol || (branch as any)?.currency || (org as any)?.currency || 'BHD';

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CREATE',
    module: 'Fees',
    details: `Recorded fee payment: ${feePayment.receiptNo} - ${student.name} - Total: ${currencyLabel} ${totalAmount.toFixed(3)} (${feeDetails})`,
    ipAddress: req.ip,
    branchId: feePayment.branchId
  });

  return feePayment;
};

// @desc    Get all fee payments
// @route   GET /api/fees
// @access  Private
router.get('/', checkPermission('fees', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      feeType = '',
      paymentMethod = '',
      status = '',
      startDate = '',
      endDate = '',
      academicYear = '',
      feeMonth = ''
    } = req.query;

    const filter: any = {};
    const andFilters: any[] = [];

    // Branch filter for non-super admins
    Object.assign(filter, getOrgBranchFilter(req));

    if (search) {
      andFilters.push({
        $or: [
        { studentName: { $regex: search, $options: 'i' } },
        { receiptNo: { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
        { class: { $regex: search, $options: 'i' } }
      ]
      });
    }

    if (feeType) {
      andFilters.push({
        $or: [
          { 'feeItems.feeType': feeType },
          { feeType }
        ]
      });
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;
    if (feeMonth) filter.feeMonth = feeMonth;
    filter.status = { $ne: 'cancelled' };

    if (startDate && endDate) {
      filter.paymentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (andFilters.length > 0) {
      filter.$and = andFilters;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      FeePayment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('studentId', 'name admissionNo class section')
        .lean(),
      FeePayment.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Fee payments retrieved successfully',
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get fee payments error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving fee payments'
    };
    res.status(500).json(response);
  }
});

// @desc    Get student IDs that already have a payment entry for the given year/month
// @route   GET /api/fees/paid-student-ids
// @access  Private
router.get('/paid-student-ids', checkPermission('fees', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      academicYear = '',
      feeMonth = '',
      classId = ''
    } = req.query;

    const filter: any = {};

    Object.assign(filter, getOrgBranchFilter(req));

    if (academicYear) filter.academicYear = academicYear;
    if (feeMonth) filter.feeMonth = feeMonth;
    if (classId) filter.classId = classId;

    const studentIds = await FeePayment.distinct('studentId', filter);

    const response: ApiResponse = {
      success: true,
      message: 'Paid student ids retrieved successfully',
      data: studentIds.map((id: any) => String(id))
    };

    res.json(response);
  } catch (error) {
    console.error('Get paid student ids error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving paid student ids'
    };
    res.status(500).json(response);
  }
});

// @desc    Create fee payment
// @route   POST /api/fees
// @access  Private
router.post('/', checkPermission('fees', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, feeItems, paymentMethod, remarks, academicYear, feeMonth } = req.body;

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      const response: ApiResponse = {
        success: false,
        message: 'Student not found'
      };
      return res.status(404).json(response);
    }

    // Validate fee items
    if (!feeItems || !Array.isArray(feeItems) || feeItems.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'At least one fee item is required'
      };
      return res.status(400).json(response);
    }

    const feePayment = await createFeePaymentRecord({
      req,
      student,
      feeItems,
      paymentMethod,
      remarks,
      academicYear,
      feeMonth
    });

    const response: ApiResponse = {
      success: true,
      message: 'Fee payment recorded successfully',
      data: feePayment
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create fee payment error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error recording fee payment'
    };
    res.status(500).json(response);
  }
});

// @desc    Create fee payments in bulk
// @route   POST /api/fees/bulk
// @access  Private
router.post('/bulk', checkPermission('fees', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const { payments, paymentMethod, remarks, academicYear, feeMonth } = req.body;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'At least one payment entry is required'
      };
      return res.status(400).json(response);
    }

    const studentIds = payments.map((payment: any) => payment.studentId).filter(Boolean);

    if (studentIds.length !== payments.length) {
      const response: ApiResponse = {
        success: false,
        message: 'Each payment entry must include a studentId'
      };
      return res.status(400).json(response);
    }

    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    const studentMap = new Map(students.map((student: any) => [student._id.toString(), student]));

    for (const payment of payments) {
      if (!payment.feeItems || !Array.isArray(payment.feeItems) || payment.feeItems.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Every selected student must have at least one fee item'
        };
        return res.status(400).json(response);
      }

      if (!studentMap.has(String(payment.studentId))) {
        const response: ApiResponse = {
          success: false,
          message: 'One or more selected students were not found'
        };
        return res.status(404).json(response);
      }
    }

    const createdPayments = [];

    for (const payment of payments) {
      const student = studentMap.get(String(payment.studentId));
      if (!student) {
        continue;
      }

      const createdPayment = await createFeePaymentRecord({
        req,
        student,
        feeItems: payment.feeItems,
        paymentMethod,
        remarks: payment.remarks || remarks,
        academicYear,
        feeMonth
      });

      createdPayments.push(createdPayment);
    }

    const totalAmount = roundCurrency(
      createdPayments.reduce((sum, payment: any) => sum + (payment.totalAmount || 0), 0)
    );

    const response: ApiResponse = {
      success: true,
      message: `${createdPayments.length} fee payments recorded successfully`,
      data: {
        payments: createdPayments,
        count: createdPayments.length,
        totalAmount
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create bulk fee payments error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error recording bulk fee payments'
    };
    res.status(500).json(response);
  }
});

// @desc    Get fee payment statistics
// @route   GET /api/fees/stats
// @access  Private
router.get('/stats/overview', checkPermission('fees', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    Object.assign(filter, getOrgBranchFilter(req));

    const activePaymentFilter = {
      ...filter,
      status: { $ne: 'cancelled' }
    };

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [
      totalCollection,
      monthlyCollection,
      dailyCollection,
      feeTypeStats,
      paymentMethodStats
    ] = await Promise.all([
      FeePayment.aggregate([
        { $match: activePaymentFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: { ...activePaymentFilter, paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: { ...activePaymentFilter, paymentDate: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: activePaymentFilter },
        { $unwind: '$feeItems' },
        { $group: { _id: '$feeItems.feeType', total: { $sum: '$feeItems.amount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: activePaymentFilter },
        { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Fee statistics retrieved successfully',
      data: {
        totalCollection: totalCollection[0] || { total: 0, count: 0 },
        monthlyCollection: monthlyCollection[0] || { total: 0, count: 0 },
        dailyCollection: dailyCollection[0] || { total: 0, count: 0 },
        feeTypeStats,
        paymentMethodStats
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get fee stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving fee statistics'
    };
    res.status(500).json(response);
  }
});

// @desc    Get receipt data for a fee payment
// @route   GET /api/fees/:id/receipt-data
// @access  Private
router.get('/:id/receipt-data', checkPermission('fees', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const payment = await FeePayment.findById(id).populate('studentId', 'name admissionNo class section');
    if (!payment) {
      const response: ApiResponse = {
        success: false,
        message: 'Fee payment not found'
      };
      return res.status(404).json(response);
    }

    const accessError = getPaymentAccessError(req, payment);
    if (accessError) {
      const response: ApiResponse = {
        success: false,
        message: accessError
      };
      return res.status(403).json(response);
    }

    // Get receipt configuration from organization + branch settings
    const receiptBranch = await Branch.findById(payment.branchId).lean();
    const receiptOrg = await Organization.findById(payment.organizationId).lean();

    if (!receiptOrg) {
      const response: ApiResponse = {
        success: false,
        message: 'Organization not found for this payment'
      };
      return res.status(404).json(response);
    }

    const settings = resolveSettings(receiptOrg, receiptBranch);

    const student = payment.studentId as any;
    const receiptData = {
      receiptNo: payment.receiptNo,
      transactionId: payment.transactionId,
      studentName: payment.studentName,
      class: payment.className || payment.class,
      admissionNo: student?.admissionNo || 'N/A',
      feeType: payment.feeItems?.map((item: any) => item.title).join(', ') || 'Fee Payment',
      feeItems: payment.feeItems,
      amount: payment.totalAmount,
      totalAmount: payment.totalAmount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      remarks: payment.remarks,
      status: payment.status,
      cancellationReason: payment.cancellation?.reason,
      cancelledAt: payment.cancellation?.cancelledAt,
      config: {
        schoolName: settings.name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        currency: settings.currency,
        currencySymbol: settings.currencySymbol || settings.currency,
        website: settings.website || '',
        logo: settings.logo || '',
        principalName: settings.principalName || '',
        taxNumber: settings.taxId || '',
        registrationNumber: settings.registrationNumber || '',
        footerText: settings.footerText || '',
      }
    };

    const response: ApiResponse = {
      success: true,
      message: 'Receipt data retrieved successfully',
      data: receiptData
    };

    res.json(response);
  } catch (error) {
    console.error('Get receipt data error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving receipt data'
    };
    res.status(500).json(response);
  }
});

// @desc    Cancel a fee payment without deleting its history
// @route   PATCH /api/fees/:id/cancel
// @access  Private
router.patch('/:id/cancel', checkPermission('fees', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const reason = String(req.body.reason || '').trim();

    if (!reason) {
      const response: ApiResponse = {
        success: false,
        message: 'Cancellation reason is required'
      };
      return res.status(400).json(response);
    }

    const payment = await FeePayment.findById(id);
    if (!payment) {
      const response: ApiResponse = {
        success: false,
        message: 'Fee payment not found'
      };
      return res.status(404).json(response);
    }

    const accessError = getPaymentAccessError(req, payment);
    if (accessError) {
      const response: ApiResponse = {
        success: false,
        message: accessError
      };
      return res.status(403).json(response);
    }

    if (payment.status === 'cancelled') {
      const response: ApiResponse = {
        success: false,
        message: 'This payment is already cancelled'
      };
      return res.status(400).json(response);
    }

    payment.status = 'cancelled';
    payment.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: req.user!._id,
      cancelledByName: req.user!.name,
      reason
    } as any;
    await payment.save();

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Fees',
      details: `Cancelled fee payment: ${payment.receiptNo} - ${payment.studentName} - Reason: ${reason}`,
      ipAddress: req.ip,
      branchId: payment.branchId,
      organizationId: payment.organizationId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Fee payment cancelled successfully',
      data: payment
    };

    res.json(response);
  } catch (error) {
    console.error('Cancel fee payment error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error cancelling fee payment'
    };
    res.status(500).json(response);
  }
});

// @desc    Edit fee payment metadata with audit trail
// @route   PATCH /api/fees/:id
// @access  Private
router.patch('/:id', checkPermission('fees', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      paymentMethod,
      paymentDate,
      remarks,
      academicYear,
      feeMonth,
      reason,
    } = req.body;

    const trimmedReason = String(reason || '').trim();
    if (!trimmedReason) {
      const response: ApiResponse = {
        success: false,
        message: 'Edit reason is required'
      };
      return res.status(400).json(response);
    }

    if (!['cash', 'bank', 'online'].includes(paymentMethod)) {
      const response: ApiResponse = {
        success: false,
        message: 'Valid payment method is required'
      };
      return res.status(400).json(response);
    }

    const nextPaymentDate = new Date(paymentDate);
    if (!paymentDate || Number.isNaN(nextPaymentDate.getTime())) {
      const response: ApiResponse = {
        success: false,
        message: 'Valid payment date is required'
      };
      return res.status(400).json(response);
    }

    const payment = await FeePayment.findById(id);
    if (!payment) {
      const response: ApiResponse = {
        success: false,
        message: 'Fee payment not found'
      };
      return res.status(404).json(response);
    }

    const accessError = getPaymentAccessError(req, payment);
    if (accessError) {
      const response: ApiResponse = {
        success: false,
        message: accessError
      };
      return res.status(403).json(response);
    }

    if (payment.status === 'cancelled') {
      const response: ApiResponse = {
        success: false,
        message: 'Cancelled payments cannot be edited'
      };
      return res.status(400).json(response);
    }

    const previousValues = getEditablePaymentSnapshot(payment);
    const nextValues = {
      paymentMethod,
      paymentDate: nextPaymentDate,
      remarks: String(remarks || '').trim() || undefined,
      academicYear: String(academicYear || '').trim() || undefined,
      feeMonth: String(feeMonth || '').trim() || undefined,
    };

    if (JSON.stringify(normalizeEditablePaymentSnapshot(previousValues)) === JSON.stringify(normalizeEditablePaymentSnapshot(nextValues))) {
      const response: ApiResponse = {
        success: false,
        message: 'No payment details were changed'
      };
      return res.status(400).json(response);
    }

    payment.paymentMethod = nextValues.paymentMethod;
    payment.paymentDate = nextValues.paymentDate;
    payment.remarks = nextValues.remarks;
    payment.academicYear = nextValues.academicYear;
    payment.feeMonth = nextValues.feeMonth;
    payment.editHistory = payment.editHistory || [];
    payment.editHistory.push({
      editedAt: new Date(),
      editedBy: req.user!._id,
      editedByName: req.user!.name,
      reason: trimmedReason,
      previousValues,
      newValues: nextValues,
    } as any);
    await payment.save();

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Fees',
      details: `Edited fee payment: ${payment.receiptNo} - ${payment.studentName} - Reason: ${trimmedReason}`,
      ipAddress: req.ip,
      branchId: payment.branchId,
      organizationId: payment.organizationId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Fee payment updated successfully',
      data: payment
    };

    res.json(response);
  } catch (error) {
    console.error('Edit fee payment error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating fee payment'
    };
    res.status(500).json(response);
  }
});

export default router;