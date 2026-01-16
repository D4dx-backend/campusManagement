import express from 'express';
import { Income } from '../models/Income';
import { ActivityLog } from '../models/ActivityLog';
import { Account } from '../models/Account';
import { AccountTransaction } from '../models/AccountTransaction';
import { authenticate, checkPermission } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Get all income entries
// @route   GET /api/income
// @access  Private
router.get('/', checkPermission('accounting', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      paymentMethod = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    } else if (req.query.branchId) {
      filter.branchId = req.query.branchId;
    }

    if (search) {
      filter.$or = [
        { receiptNo: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { receivedFrom: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [incomes, total] = await Promise.all([
      Income.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('accountId', 'accountName accountType'),
      Income.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Income entries retrieved successfully',
      data: incomes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get income error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving income entries'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new income entry
// @route   POST /api/income
// @access  Private
router.post('/', checkPermission('accounting', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      date,
      category,
      description,
      amount,
      paymentMethod,
      receivedFrom,
      contactInfo,
      accountId,
      remarks
    } = req.body;

    // Validate required fields
    if (!category || !description || !amount || !receivedFrom) {
      const response: ApiResponse = {
        success: false,
        message: 'Category, description, amount, and source are required'
      };
      return res.status(400).json(response);
    }

    // Generate receipt number
    const receiptNo = `INC${Date.now()}`;

    const income = new Income({
      receiptNo,
      date: date || new Date(),
      category,
      description,
      amount: Number(amount),
      paymentMethod,
      receivedFrom,
      contactInfo,
      accountId,
      remarks,
      branchId: req.user!.branchId,
      createdBy: req.user!._id
    });

    await income.save();

    // Update account balance if accountId provided
    if (accountId) {
      const account = await Account.findById(accountId);
      if (account) {
        const balanceBefore = account.currentBalance;
        const balanceAfter = balanceBefore + Number(amount);

        // Update account balance
        account.currentBalance = balanceAfter;
        await account.save();

        // Create account transaction
        await AccountTransaction.create({
          transactionDate: income.date,
          accountId,
          transactionType: 'credit',
          amount: Number(amount),
          referenceType: 'adjustment',
          referenceId: income._id,
          referenceNo: income.receiptNo,
          description: `Income: ${description}`,
          balanceBefore,
          balanceAfter,
          branchId: req.user!.branchId,
          createdBy: req.user!._id
        });
      }
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Income',
      details: `Recorded income: ${receiptNo} - ${category} - ₹${amount}`,
      ipAddress: req.ip,
      branchId: income.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Income recorded successfully',
      data: income
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create income error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error recording income'
    };
    res.status(500).json(response);
  }
});

// @desc    Get income statistics
// @route   GET /api/income/stats
// @access  Private
router.get('/stats/overview', checkPermission('accounting', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    } else if (req.query.branchId) {
      filter.branchId = req.query.branchId;
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalIncome,
      monthlyIncome,
      categoryStats
    ] = await Promise.all([
      Income.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Income.aggregate([
        { $match: { ...filter, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Income.aggregate([
        { $match: filter },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Income statistics retrieved successfully',
      data: {
        totalIncome: totalIncome[0] || { total: 0, count: 0 },
        monthlyIncome: monthlyIncome[0] || { total: 0, count: 0 },
        categoryStats
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get income stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving income statistics'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete income entry
// @route   DELETE /api/income/:id
// @access  Private
router.delete('/:id', checkPermission('accounting', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const income = await Income.findById(id);
    if (!income) {
      const response: ApiResponse = {
        success: false,
        message: 'Income entry not found'
      };
      return res.status(404).json(response);
    }

    // Check branch access
    if (req.user!.role !== 'super_admin' && req.user!.branchId?.toString() !== income.branchId?.toString()) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied to this income entry'
      };
      return res.status(403).json(response);
    }

    // Reverse account transaction if exists
    if (income.accountId) {
      const account = await Account.findById(income.accountId);
      if (account) {
        account.currentBalance -= income.amount;
        await account.save();

        // Mark transaction as reversed (or delete it)
        await AccountTransaction.deleteOne({
          referenceType: 'adjustment',
          referenceId: income._id
        });
      }
    }

    await income.deleteOne();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Income',
      details: `Deleted income: ${income.receiptNo} - ${income.category}`,
      ipAddress: req.ip,
      branchId: income.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Income entry deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete income error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting income entry'
    };
    res.status(500).json(response);
  }
});

export default router;
