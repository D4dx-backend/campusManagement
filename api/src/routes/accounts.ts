import express from 'express';
import { Account } from '../models/Account';
import { AccountTransaction } from '../models/AccountTransaction';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Get all accounts
// @route   GET /api/accounts
// @access  Private
router.get('/', checkPermission('accounting', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { accountType, isActive = 'true' } = req.query;
    
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    } else if (req.query.branchId) {
      filter.branchId = req.query.branchId;
    }

    if (accountType) filter.accountType = accountType;
    if (isActive) filter.isActive = isActive === 'true';

    const accounts = await Account.find(filter).sort({ accountName: 1 });

    const response: ApiResponse = {
      success: true,
      message: 'Accounts retrieved successfully',
      data: accounts
    };

    res.json(response);
  } catch (error) {
    console.error('Get accounts error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving accounts'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new account
// @route   POST /api/accounts
// @access  Private
router.post('/', checkPermission('accounting', 'create'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      accountName,
      accountType,
      accountNumber,
      bankName,
      branchName,
      ifscCode,
      openingBalance = 0,
      description
    } = req.body;

    // Validate required fields
    if (!accountName || !accountType) {
      const response: ApiResponse = {
        success: false,
        message: 'Account name and type are required'
      };
      return res.status(400).json(response);
    }

    // Bank accounts should have bank details
    if (accountType === 'bank' && !accountNumber) {
      const response: ApiResponse = {
        success: false,
        message: 'Account number is required for bank accounts'
      };
      return res.status(400).json(response);
    }

    const account = new Account({
      accountName,
      accountType,
      accountNumber,
      bankName,
      branchName,
      ifscCode,
      openingBalance,
      currentBalance: openingBalance,
      description,
      branchId: req.user!.branchId,
      createdBy: req.user!._id
    });

    await account.save();

    // Create opening balance transaction if > 0
    if (openingBalance > 0) {
      await AccountTransaction.create({
        transactionDate: new Date(),
        accountId: account._id,
        transactionType: 'credit',
        amount: openingBalance,
        referenceType: 'opening_balance',
        description: `Opening balance for ${accountName}`,
        balanceBefore: 0,
        balanceAfter: openingBalance,
        branchId: req.user!.branchId,
        createdBy: req.user!._id
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Accounts',
      details: `Created ${accountType} account: ${accountName}`,
      ipAddress: req.ip,
      branchId: account.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Account created successfully',
      data: account
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create account error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating account'
    };
    res.status(500).json(response);
  }
});

// @desc    Get account transactions
// @route   GET /api/accounts/:id/transactions
// @access  Private
router.get('/:id/transactions', checkPermission('accounting', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, startDate, endDate, isReconciled } = req.query;

    const account = await Account.findById(id);
    if (!account) {
      const response: ApiResponse = {
        success: false,
        message: 'Account not found'
      };
      return res.status(404).json(response);
    }

    // Check branch access
    if (req.user!.role !== 'super_admin' && req.user!.branchId?.toString() !== account.branchId?.toString()) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied to this account'
      };
      return res.status(403).json(response);
    }

    const filter: any = { accountId: id };

    if (startDate && endDate) {
      filter.transactionDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (isReconciled !== undefined) {
      filter.isReconciled = isReconciled === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      AccountTransaction.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AccountTransaction.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Account transactions retrieved successfully',
      data: {
        account,
        transactions
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get account transactions error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving transactions'
    };
    res.status(500).json(response);
  }
});

// @desc    Reconcile transactions
// @route   POST /api/accounts/:id/reconcile
// @access  Private
router.post('/:id/reconcile', checkPermission('accounting', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { transactionIds, reconciledDate = new Date() } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Transaction IDs are required'
      };
      return res.status(400).json(response);
    }

    const account = await Account.findById(id);
    if (!account) {
      const response: ApiResponse = {
        success: false,
        message: 'Account not found'
      };
      return res.status(404).json(response);
    }

    // Update transactions
    const result = await AccountTransaction.updateMany(
      {
        _id: { $in: transactionIds },
        accountId: id,
        isReconciled: false
      },
      {
        $set: {
          isReconciled: true,
          reconciledDate: new Date(reconciledDate)
        }
      }
    );

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Accounts',
      details: `Reconciled ${result.modifiedCount} transactions for account: ${account.accountName}`,
      ipAddress: req.ip,
      branchId: account.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: `Successfully reconciled ${result.modifiedCount} transactions`,
      data: { reconciledCount: result.modifiedCount }
    };

    res.json(response);
  } catch (error) {
    console.error('Reconcile transactions error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error reconciling transactions'
    };
    res.status(500).json(response);
  }
});

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
router.put('/:id', checkPermission('accounting', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Don't allow updating balance directly
    delete updateData.currentBalance;
    delete updateData.openingBalance;

    const account = await Account.findByIdAndUpdate(id, updateData, { new: true });

    if (!account) {
      const response: ApiResponse = {
        success: false,
        message: 'Account not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Accounts',
      details: `Updated account: ${account.accountName}`,
      ipAddress: req.ip,
      branchId: account.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Account updated successfully',
      data: account
    };

    res.json(response);
  } catch (error) {
    console.error('Update account error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating account'
    };
    res.status(500).json(response);
  }
});

export default router;
