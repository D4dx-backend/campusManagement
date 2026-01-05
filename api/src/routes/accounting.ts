import express from 'express';
import { FeePayment } from '../models/FeePayment';
import { Expense } from '../models/Expense';
import { PayrollEntry } from '../models/PayrollEntry';
import { authenticate, checkPermission } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import Joi from 'joi';

const router = express.Router();
router.use(authenticate);

// Validation schemas
const dateRangeSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  transactionType: Joi.string().valid('all', 'income', 'expense').optional(),
  search: Joi.string().allow('').optional(),
});

const ledgerQuerySchema = Joi.object({
  accountType: Joi.string().valid('all', 'fees', 'expenses', 'payroll').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const balanceSheetSchema = Joi.object({
  asOfDate: Joi.date().optional(),
});

const annualReportSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).optional(),
});

// GET /api/accounting/daybook - Get day book entries (chronological transactions)
router.get(
  '/daybook',
  checkPermission('accounting', 'read'),
  validateQuery(dateRangeSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { startDate, endDate, page = 1, limit = 10, transactionType = 'all', search = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build date filter
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate as string);
      } else {
        // Default to current month
        const now = new Date();
        dateFilter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate as string);
      } else {
        dateFilter.$lte = new Date();
      }

      // Branch filter
      const branchFilter: any = {};
      if (req.user!.role !== 'super_admin') {
        branchFilter.branchId = req.user!.branchId;
      }

      // Aggregation pipeline to combine all transactions
      const transactions: any[] = [];

      // Fetch fee payments (income)
      if (transactionType === 'all' || transactionType === 'income') {
        const feePayments = await FeePayment.find({
          ...branchFilter,
          paymentDate: dateFilter,
          status: 'paid',
        })
          .populate('studentId', 'name rollNumber')
          .populate('classId', 'name')
          .populate('branchId', 'name')
          .sort({ paymentDate: -1 })
          .lean();

        feePayments.forEach((payment: any) => {
          const totalAmount =
            (payment.tuitionFee || 0) +
            (payment.transportFee || 0) +
            (payment.cocurricularFee || 0) +
            (payment.maintenanceFee || 0) +
            (payment.examFee || 0) +
            (payment.textbookFee || 0);

          transactions.push({
            _id: payment._id,
            date: payment.paymentDate,
            type: 'income',
            category: 'Fee Payment',
            description: `Fee payment from ${payment.studentId?.name || 'Unknown'} - Receipt #${payment.receiptNumber}`,
            amount: totalAmount,
            paymentMethod: payment.paymentMethod,
            referenceNumber: payment.receiptNumber,
            studentName: payment.studentId?.name,
            className: payment.classId?.name,
            branchName: payment.branchId?.name,
          });
        });
      }

      // Fetch expenses
      if (transactionType === 'all' || transactionType === 'expense') {
        const expenses = await Expense.find({
          ...branchFilter,
          expenseDate: dateFilter,
          status: { $in: ['pending', 'approved'] },
        })
          .populate('categoryId', 'name')
          .populate('branchId', 'name')
          .sort({ expenseDate: -1 })
          .lean();

        expenses.forEach((expense: any) => {
          transactions.push({
            _id: expense._id,
            date: expense.expenseDate,
            type: 'expense',
            category: expense.categoryId?.name || 'Uncategorized',
            description: expense.description,
            amount: expense.amount,
            paymentMethod: expense.paymentMethod,
            referenceNumber: expense.voucherNumber,
            branchName: expense.branchId?.name,
            status: expense.status,
          });
        });
      }

      // Sort all transactions by date (descending)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply search filter
      let filteredTransactions = transactions;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredTransactions = transactions.filter(
          (t) =>
            t.description?.toLowerCase().includes(searchLower) ||
            t.category?.toLowerCase().includes(searchLower) ||
            t.referenceNumber?.toLowerCase().includes(searchLower) ||
            t.studentName?.toLowerCase().includes(searchLower)
        );
      }

      // Pagination
      const total = filteredTransactions.length;
      const paginatedTransactions = filteredTransactions.slice(skip, skip + Number(limit));

      // Calculate totals
      const totalIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      res.json({
        success: true,
        data: {
          transactions: paginatedTransactions,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit),
          },
          summary: {
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching day book:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch day book entries',
        error: error.message,
      });
    }
  }
);

// GET /api/accounting/ledger - Get ledger accounts with balances
router.get(
  '/ledger',
  checkPermission('accounting', 'read'),
  validateQuery(ledgerQuerySchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { accountType = 'all', startDate, endDate, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build date filter
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate as string);
      }

      // Branch filter
      const branchFilter: any = {};
      if (req.user!.role !== 'super_admin') {
        branchFilter.branchId = req.user!.branchId;
      }

      const ledgerAccounts: any[] = [];

      // Fee Income Accounts
      if (accountType === 'all' || accountType === 'fees') {
        const feeQuery: any = { ...branchFilter, status: 'paid' };
        if (Object.keys(dateFilter).length > 0) {
          feeQuery.paymentDate = dateFilter;
        }

        const feeStats = await FeePayment.aggregate([
          { $match: feeQuery },
          {
            $group: {
              _id: null,
              totalAmount: {
                $sum: {
                  $add: [
                    { $ifNull: ['$tuitionFee', 0] },
                    { $ifNull: ['$transportFee', 0] },
                    { $ifNull: ['$cocurricularFee', 0] },
                    { $ifNull: ['$maintenanceFee', 0] },
                    { $ifNull: ['$examFee', 0] },
                    { $ifNull: ['$textbookFee', 0] },
                  ],
                },
              },
              transactionCount: { $sum: 1 },
            },
          },
        ]);

        ledgerAccounts.push({
          accountName: 'Fee Income',
          accountType: 'income',
          balance: feeStats[0]?.totalAmount || 0,
          transactionCount: feeStats[0]?.transactionCount || 0,
        });
      }

      // Expense Accounts by Category
      if (accountType === 'all' || accountType === 'expenses') {
        const expenseQuery: any = { ...branchFilter, status: { $in: ['pending', 'approved'] } };
        if (Object.keys(dateFilter).length > 0) {
          expenseQuery.expenseDate = dateFilter;
        }

        const expenseStats = await Expense.aggregate([
          { $match: expenseQuery },
          {
            $lookup: {
              from: 'expensecategories',
              localField: 'categoryId',
              foreignField: '_id',
              as: 'category',
            },
          },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$categoryId',
              categoryName: { $first: '$category.name' },
              totalAmount: { $sum: '$amount' },
              transactionCount: { $sum: 1 },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]);

        expenseStats.forEach((stat) => {
          ledgerAccounts.push({
            accountName: stat.categoryName || 'Uncategorized Expense',
            accountType: 'expense',
            balance: stat.totalAmount,
            transactionCount: stat.transactionCount,
          });
        });
      }

      // Payroll Accounts
      if (accountType === 'all' || accountType === 'payroll') {
        const payrollQuery: any = { ...branchFilter, status: 'paid' };
        if (Object.keys(dateFilter).length > 0) {
          payrollQuery.paymentDate = dateFilter;
        }

        const payrollStats = await PayrollEntry.aggregate([
          { $match: payrollQuery },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$netSalary' },
              transactionCount: { $sum: 1 },
            },
          },
        ]);

        ledgerAccounts.push({
          accountName: 'Payroll Expenses',
          accountType: 'expense',
          balance: payrollStats[0]?.totalAmount || 0,
          transactionCount: payrollStats[0]?.transactionCount || 0,
        });
      }

      // Calculate totals
      const totalIncome = ledgerAccounts
        .filter((acc) => acc.accountType === 'income')
        .reduce((sum, acc) => sum + acc.balance, 0);
      const totalExpense = ledgerAccounts
        .filter((acc) => acc.accountType === 'expense')
        .reduce((sum, acc) => sum + acc.balance, 0);

      // Pagination
      const total = ledgerAccounts.length;
      const paginatedAccounts = ledgerAccounts.slice(skip, skip + Number(limit));

      res.json({
        success: true,
        data: {
          accounts: paginatedAccounts,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit),
          },
          trialBalance: {
            totalDebit: totalExpense,
            totalCredit: totalIncome,
            difference: totalIncome - totalExpense,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching ledger:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ledger accounts',
        error: error.message,
      });
    }
  }
);

// GET /api/accounting/fee-details - Get detailed fee analysis
router.get(
  '/fee-details',
  checkPermission('accounting', 'read'),
  validateQuery(dateRangeSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { startDate, endDate, page = 1, limit = 10, search = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build date filter
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate as string);
      }

      // Branch filter
      const branchFilter: any = {};
      if (req.user!.role !== 'super_admin') {
        branchFilter.branchId = req.user!.branchId;
      }

      // Build search filter
      const searchFilter: any = {};
      if (search) {
        searchFilter.$or = [
          { receiptNumber: { $regex: search, $options: 'i' } },
          { transactionId: { $regex: search, $options: 'i' } },
        ];
      }

      // Build query
      const query: any = { ...branchFilter, ...searchFilter };
      if (Object.keys(dateFilter).length > 0) {
        query.paymentDate = dateFilter;
      }

      // Fetch fee payments with detailed breakdown
      const feePayments = await FeePayment.find(query)
        .populate('studentId', 'name rollNumber phoneNumber')
        .populate('classId', 'name')
        .populate('divisionId', 'name')
        .populate('branchId', 'name')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await FeePayment.countDocuments(query);

      // Calculate detailed breakdown
      const breakdown = await FeePayment.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalTuitionFee: { $sum: { $ifNull: ['$tuitionFee', 0] } },
            totalTransportFee: { $sum: { $ifNull: ['$transportFee', 0] } },
            totalCocurricularFee: { $sum: { $ifNull: ['$cocurricularFee', 0] } },
            totalMaintenanceFee: { $sum: { $ifNull: ['$maintenanceFee', 0] } },
            totalExamFee: { $sum: { $ifNull: ['$examFee', 0] } },
            totalTextbookFee: { $sum: { $ifNull: ['$textbookFee', 0] } },
            totalPaid: {
              $sum: {
                $add: [
                  { $ifNull: ['$tuitionFee', 0] },
                  { $ifNull: ['$transportFee', 0] },
                  { $ifNull: ['$cocurricularFee', 0] },
                  { $ifNull: ['$maintenanceFee', 0] },
                  { $ifNull: ['$examFee', 0] },
                  { $ifNull: ['$textbookFee', 0] },
                ],
              },
            },
            paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            partialCount: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
          },
        },
      ]);

      // Payment method breakdown
      const paymentMethodBreakdown = await FeePayment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: {
              $sum: {
                $add: [
                  { $ifNull: ['$tuitionFee', 0] },
                  { $ifNull: ['$transportFee', 0] },
                  { $ifNull: ['$cocurricularFee', 0] },
                  { $ifNull: ['$maintenanceFee', 0] },
                  { $ifNull: ['$examFee', 0] },
                  { $ifNull: ['$textbookFee', 0] },
                ],
              },
            },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          feePayments: feePayments.map((payment: any) => ({
            ...payment,
            totalAmount:
              (payment.tuitionFee || 0) +
              (payment.transportFee || 0) +
              (payment.cocurricularFee || 0) +
              (payment.maintenanceFee || 0) +
              (payment.examFee || 0) +
              (payment.textbookFee || 0),
          })),
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit),
          },
          breakdown: breakdown[0] || {},
          paymentMethodBreakdown,
        },
      });
    } catch (error: any) {
      console.error('Error fetching fee details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee details',
        error: error.message,
      });
    }
  }
);

// GET /api/accounting/balance-sheet - Get balance sheet (assets vs liabilities)
router.get(
  '/balance-sheet',
  checkPermission('accounting', 'read'),
  validateQuery(balanceSheetSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { asOfDate } = req.query;
      const endDate = asOfDate ? new Date(asOfDate as string) : new Date();

      // Branch filter
      const branchFilter: any = {};
      if (req.user!.role !== 'super_admin') {
        branchFilter.branchId = req.user!.branchId;
      }

      // Calculate total income (assets)
      const totalFeeIncome = await FeePayment.aggregate([
        {
          $match: {
            ...branchFilter,
            paymentDate: { $lte: endDate },
            status: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $ifNull: ['$tuitionFee', 0] },
                  { $ifNull: ['$transportFee', 0] },
                  { $ifNull: ['$cocurricularFee', 0] },
                  { $ifNull: ['$maintenanceFee', 0] },
                  { $ifNull: ['$examFee', 0] },
                  { $ifNull: ['$textbookFee', 0] },
                ],
              },
            },
          },
        },
      ]);

      // Calculate total expenses (liabilities)
      const totalExpenses = await Expense.aggregate([
        {
          $match: {
            ...branchFilter,
            expenseDate: { $lte: endDate },
            status: { $in: ['pending', 'approved'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      // Calculate total payroll (liabilities)
      const totalPayroll = await PayrollEntry.aggregate([
        {
          $match: {
            ...branchFilter,
            paymentDate: { $lte: endDate },
            status: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netSalary' },
          },
        },
      ]);

      // Calculate pending fees (accounts receivable - asset)
      const pendingFees = await FeePayment.aggregate([
        {
          $match: {
            ...branchFilter,
            dueDate: { $lte: endDate },
            status: { $in: ['pending', 'partial'] },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $ifNull: ['$tuitionFee', 0] },
                  { $ifNull: ['$transportFee', 0] },
                  { $ifNull: ['$cocurricularFee', 0] },
                  { $ifNull: ['$maintenanceFee', 0] },
                  { $ifNull: ['$examFee', 0] },
                  { $ifNull: ['$textbookFee', 0] },
                ],
              },
            },
          },
        },
      ]);

      // Calculate pending expenses (accounts payable - liability)
      const pendingExpenses = await Expense.aggregate([
        {
          $match: {
            ...branchFilter,
            expenseDate: { $lte: endDate },
            status: 'pending',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const feeIncome = totalFeeIncome[0]?.total || 0;
      const expenseAmount = totalExpenses[0]?.total || 0;
      const payrollAmount = totalPayroll[0]?.total || 0;
      const pendingFeesAmount = pendingFees[0]?.total || 0;
      const pendingExpensesAmount = pendingExpenses[0]?.total || 0;

      // Assets
      const assets = {
        cashAndBank: feeIncome - expenseAmount - payrollAmount,
        accountsReceivable: pendingFeesAmount,
        totalAssets: feeIncome - expenseAmount - payrollAmount + pendingFeesAmount,
      };

      // Liabilities
      const liabilities = {
        accountsPayable: pendingExpensesAmount,
        totalLiabilities: pendingExpensesAmount,
      };

      // Equity
      const equity = {
        retainedEarnings: assets.totalAssets - liabilities.totalLiabilities,
        totalEquity: assets.totalAssets - liabilities.totalLiabilities,
      };

      res.json({
        success: true,
        data: {
          asOfDate: endDate,
          assets,
          liabilities,
          equity,
          totalAssetsAndEquity: assets.totalAssets,
          totalLiabilitiesAndEquity: liabilities.totalLiabilities + equity.totalEquity,
          isBalanced: Math.abs(assets.totalAssets - (liabilities.totalLiabilities + equity.totalEquity)) < 0.01,
        },
      });
    } catch (error: any) {
      console.error('Error fetching balance sheet:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch balance sheet',
        error: error.message,
      });
    }
  }
);

// GET /api/accounting/annual-report - Get annual finance report with monthly breakdown
router.get(
  '/annual-report',
  checkPermission('accounting', 'read'),
  validateQuery(annualReportSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { year } = req.query;
      const reportYear = year ? Number(year) : new Date().getFullYear();

      // Fiscal year: April to March
      const startDate = new Date(reportYear, 3, 1); // April 1st
      const endDate = new Date(reportYear + 1, 2, 31); // March 31st

      // Branch filter
      const branchFilter: any = {};
      if (req.user!.role !== 'super_admin') {
        branchFilter.branchId = req.user!.branchId;
      }

      // Monthly fee income breakdown
      const monthlyFeeIncome = await FeePayment.aggregate([
        {
          $match: {
            ...branchFilter,
            paymentDate: { $gte: startDate, $lte: endDate },
            status: 'paid',
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' },
            },
            totalAmount: {
              $sum: {
                $add: [
                  { $ifNull: ['$tuitionFee', 0] },
                  { $ifNull: ['$transportFee', 0] },
                  { $ifNull: ['$cocurricularFee', 0] },
                  { $ifNull: ['$maintenanceFee', 0] },
                  { $ifNull: ['$examFee', 0] },
                  { $ifNull: ['$textbookFee', 0] },
                ],
              },
            },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Monthly expenses breakdown
      const monthlyExpenses = await Expense.aggregate([
        {
          $match: {
            ...branchFilter,
            expenseDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['pending', 'approved'] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$expenseDate' },
              month: { $month: '$expenseDate' },
            },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Monthly payroll breakdown
      const monthlyPayroll = await PayrollEntry.aggregate([
        {
          $match: {
            ...branchFilter,
            paymentDate: { $gte: startDate, $lte: endDate },
            status: 'paid',
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' },
            },
            totalAmount: { $sum: '$netSalary' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Expense category breakdown
      const expenseByCategory = await Expense.aggregate([
        {
          $match: {
            ...branchFilter,
            expenseDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['pending', 'approved'] },
          },
        },
        {
          $lookup: {
            from: 'expensecategories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$categoryId',
            categoryName: { $first: '$category.name' },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]);

      // Create monthly summary (12 months)
      const monthlySummary = [];
      const monthNames = [
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
        'January',
        'February',
        'March',
      ];

      for (let i = 0; i < 12; i++) {
        const monthIndex = (i + 3) % 12; // Start from April (index 3)
        const yearForMonth = i < 9 ? reportYear : reportYear + 1;

        const feeData = monthlyFeeIncome.find(
          (item) => item._id.year === yearForMonth && item._id.month === monthIndex + 1
        );
        const expenseData = monthlyExpenses.find(
          (item) => item._id.year === yearForMonth && item._id.month === monthIndex + 1
        );
        const payrollData = monthlyPayroll.find(
          (item) => item._id.year === yearForMonth && item._id.month === monthIndex + 1
        );

        const income = feeData?.totalAmount || 0;
        const expenses = (expenseData?.totalAmount || 0) + (payrollData?.totalAmount || 0);

        monthlySummary.push({
          month: monthNames[i],
          monthNumber: monthIndex + 1,
          year: yearForMonth,
          income,
          expenses,
          netProfit: income - expenses,
        });
      }

      // Calculate totals
      const totalIncome = monthlySummary.reduce((sum, item) => sum + item.income, 0);
      const totalExpenses = monthlySummary.reduce((sum, item) => sum + item.expenses, 0);
      const netProfit = totalIncome - totalExpenses;

      res.json({
        success: true,
        data: {
          fiscalYear: `${reportYear}-${reportYear + 1}`,
          startDate,
          endDate,
          monthlySummary,
          expenseByCategory,
          summary: {
            totalIncome,
            totalExpenses,
            netProfit,
            profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching annual report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch annual report',
        error: error.message,
      });
    }
  }
);

export default router;
