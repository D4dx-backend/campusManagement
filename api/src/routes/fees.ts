import express from 'express';
import { FeePayment } from '../models/FeePayment';
import { Student } from '../models/Student';
import { ActivityLog } from '../models/ActivityLog';
import { ReceiptConfig } from '../models/ReceiptConfig';
import { authenticate, checkPermission } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { sendFeeReceiptEmail, sendFeeReceiptWhatsApp } from '../utils/notificationService';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

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
      endDate = ''
    } = req.query;

    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    } else if (req.query.branchId) {
      // Super admin can filter by specific branch
      filter.branchId = req.query.branchId;
    }

    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { receiptNo: { $regex: search, $options: 'i' } },
        { class: { $regex: search, $options: 'i' } }
      ];
    }

    if (feeType) filter.feeType = feeType;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;

    if (startDate && endDate) {
      filter.paymentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
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

// @desc    Create fee payment
// @route   POST /api/fees
// @access  Private
router.post('/', checkPermission('fees', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, feeItems, paymentMethod, remarks } = req.body;

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

    // Calculate total amount
    const totalAmount = feeItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

    // Generate receipt number and transaction ID
    const receiptNo = `REC${Date.now()}`;
    const transactionId = `TXN${Date.now()}`;

    // Create fee payment
    const feePayment = new FeePayment({
      receiptNo,
      transactionId,
      studentId,
      studentName: student.name,
      classId: student.classId,
      className: student.class,
      feeItems,
      totalAmount,
      paymentDate: new Date(),
      paymentMethod,
      status: 'paid',
      remarks,
      branchId: req.user!.branchId || student.branchId,
      createdBy: req.user!._id
    });

    await feePayment.save();

    // Send automatic notifications (email & WhatsApp)
    const receiptConfig = await ReceiptConfig.findOne({ 
      branchId: feePayment.branchId, 
      isActive: true 
    });

    const notificationData = {
      receiptNo: feePayment.receiptNo,
      studentName: student.name,
      class: student.class,
      feeItems: feePayment.feeItems || [],
      totalAmount: feePayment.totalAmount || 0,
      paymentDate: feePayment.paymentDate,
      paymentMethod: feePayment.paymentMethod,
      institutionName: (receiptConfig as any)?.institutionName,
      guardianEmail: student.guardianEmail,
      guardianPhone: student.guardianPhone || ''
    };

    // Send notifications asynchronously (non-blocking)
    Promise.all([
      sendFeeReceiptEmail(notificationData),
      sendFeeReceiptWhatsApp(notificationData)
    ]).catch(error => {
      console.error('Notification sending error:', error);
      // Don't fail the transaction if notifications fail
    });

    // Create detailed log message
    const feeDetails = feeItems.map((item: any) => `${item.title}: ₹${item.amount}`).join(', ');
    
    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Fees',
      details: `Recorded fee payment: ${receiptNo} - ${student.name} - Total: ₹${totalAmount} (${feeDetails})`,
      ipAddress: req.ip,
      branchId: feePayment.branchId
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

// @desc    Get fee payment statistics
// @route   GET /api/fees/stats
// @access  Private
router.get('/stats/overview', checkPermission('fees', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    } else if (req.query.branchId) {
      // Super admin can filter by specific branch
      filter.branchId = req.query.branchId;
    }

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
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: { ...filter, paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: { ...filter, paymentDate: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: filter },
        { $unwind: '$feeItems' },
        { $group: { _id: '$feeItems.feeType', total: { $sum: '$feeItems.amount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: filter },
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

    // Check branch access
    if (req.user!.role !== 'super_admin' && req.user!.branchId?.toString() !== payment.branchId?.toString()) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied to this payment record'
      };
      return res.status(403).json(response);
    }

    // Get receipt configuration for the branch
    const receiptConfig = await ReceiptConfig.findOne({ 
      branchId: payment.branchId, 
      isActive: true 
    });

    if (!receiptConfig) {
      const response: ApiResponse = {
        success: false,
        message: 'Receipt configuration not found for this branch'
      };
      return res.status(404).json(response);
    }

    const student = payment.studentId as any;
    const receiptData = {
      receiptNo: payment.receiptNo,
      transactionId: payment.transactionId,
      studentName: payment.studentName,
      class: payment.className || payment.class,
      admissionNo: student?.admissionNo || 'N/A',
      feeItems: payment.feeItems,
      totalAmount: payment.totalAmount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      remarks: payment.remarks,
      config: receiptConfig
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

export default router;