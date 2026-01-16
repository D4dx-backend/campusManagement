import express from 'express';
import { Student } from '../models/Student';
import { Staff } from '../models/Staff';
import { FeePayment } from '../models/FeePayment';
import { PayrollEntry } from '../models/PayrollEntry';
import { Expense } from '../models/Expense';
import { TextBook } from '../models/TextBook';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import Joi from 'joi';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const dateRangeSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  format: Joi.string().valid('json', 'csv').default('json')
});

const financialReportSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  includeBreakdown: Joi.boolean().default(true),
  format: Joi.string().valid('json', 'csv').default('json')
});

// @desc    Get dashboard overview report
// @route   GET /api/reports/dashboard
// @access  Private
router.get('/dashboard', checkPermission('reports', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    const [
      studentStats,
      staffStats,
      feeStats,
      expenseStats,
      textbookStats,
      recentActivities
    ] = await Promise.all([
      // Student Statistics
      Student.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
          }
        }
      ]),

      // Staff Statistics
      Staff.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            totalSalary: { $sum: '$salary' }
          }
        }
      ]),

      // Fee Statistics
      FeePayment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalCollection: { $sum: '$amount' },
            monthlyCollection: {
              $sum: {
                $cond: [
                  { $gte: ['$paymentDate', startOfMonth] },
                  '$amount',
                  0
                ]
              }
            },
            yearlyCollection: {
              $sum: {
                $cond: [
                  { $gte: ['$paymentDate', startOfYear] },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ]),

      // Expense Statistics
      Expense.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            monthlyExpenses: {
              $sum: {
                $cond: [
                  { $gte: ['$date', startOfMonth] },
                  '$amount',
                  0
                ]
              }
            },
            yearlyExpenses: {
              $sum: {
                $cond: [
                  { $gte: ['$date', startOfYear] },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ]),

      // Textbook Statistics
      TextBook.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalBooks: { $sum: '$quantity' },
            availableBooks: { $sum: '$available' },
            totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
          }
        }
      ]),

      // Recent Activities
      ActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .limit(10)
        .select('userName userRole module action details timestamp')
        .lean()
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Dashboard report retrieved successfully',
      data: {
        students: studentStats[0] || { total: 0, active: 0, inactive: 0 },
        staff: staffStats[0] || { total: 0, active: 0, totalSalary: 0 },
        fees: feeStats[0] || { totalCollection: 0, monthlyCollection: 0, yearlyCollection: 0 },
        expenses: expenseStats[0] || { totalExpenses: 0, monthlyExpenses: 0, yearlyExpenses: 0 },
        textbooks: textbookStats[0] || { totalBooks: 0, availableBooks: 0, totalValue: 0 },
        recentActivities,
        generatedAt: new Date()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get dashboard report error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving dashboard report'
    };
    res.status(500).json(response);
  }
});

// @desc    Get financial report
// @route   GET /api/reports/financial
// @access  Private
router.get('/financial', checkPermission('reports', 'read'), validateQuery(financialReportSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, includeBreakdown } = req.query;
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const dateFilter = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };

    const [
      feeCollection,
      expenses,
      payrollExpenses,
      feeBreakdown,
      expenseBreakdown
    ] = await Promise.all([
      // Fee Collection
      FeePayment.aggregate([
        { $match: { ...filter, paymentDate: dateFilter } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]),

      // General Expenses
      Expense.aggregate([
        { $match: { ...filter, date: dateFilter } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]),

      // Payroll Expenses
      PayrollEntry.aggregate([
        { $match: { ...filter, paymentDate: dateFilter } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$netSalary' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]),

      // Fee Breakdown (if requested)
      includeBreakdown ? FeePayment.aggregate([
        { $match: { ...filter, paymentDate: dateFilter } },
        {
          $group: {
            _id: '$feeType',
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]) : [],

      // Expense Breakdown (if requested)
      includeBreakdown ? Expense.aggregate([
        { $match: { ...filter, date: dateFilter } },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]) : []
    ]);

    const totalIncome = (feeCollection[0]?.totalAmount || 0);
    const totalExpenses = (expenses[0]?.totalAmount || 0) + (payrollExpenses[0]?.totalAmount || 0);
    const netProfit = totalIncome - totalExpenses;

    const response: ApiResponse = {
      success: true,
      message: 'Financial report retrieved successfully',
      data: {
        period: {
          startDate,
          endDate
        },
        summary: {
          totalIncome,
          totalExpenses,
          netProfit,
          profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0
        },
        income: {
          feeCollection: feeCollection[0] || { totalAmount: 0, totalTransactions: 0 },
          breakdown: includeBreakdown ? feeBreakdown : undefined
        },
        expenses: {
          generalExpenses: expenses[0] || { totalAmount: 0, totalTransactions: 0 },
          payrollExpenses: payrollExpenses[0] || { totalAmount: 0, totalTransactions: 0 },
          breakdown: includeBreakdown ? expenseBreakdown : undefined
        },
        generatedAt: new Date()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get financial report error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving financial report'
    };
    res.status(500).json(response);
  }
});

// @desc    Get student report
// @route   GET /api/reports/students
// @access  Private
router.get('/students', checkPermission('reports', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const [
      totalStats,
      classStats,
      transportStats,
      admissionTrend,
      ageDistribution
    ] = await Promise.all([
      // Total Statistics
      Student.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
          }
        }
      ]),

      // Class-wise Statistics
      Student.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { class: '$class', section: '$section' },
            count: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
          }
        },
        { $sort: { '_id.class': 1, '_id.section': 1 } }
      ]),

      // Transport Statistics
      Student.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$transport',
            count: { $sum: 1 }
          }
        }
      ]),

      // Admission Trend (last 12 months)
      Student.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]),

      // Age Distribution
      Student.aggregate([
        { $match: filter },
        {
          $addFields: {
            age: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
                  365.25 * 24 * 60 * 60 * 1000
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$age', 5] }, then: 'Under 5' },
                  { case: { $lt: ['$age', 8] }, then: '5-7 years' },
                  { case: { $lt: ['$age', 11] }, then: '8-10 years' },
                  { case: { $lt: ['$age', 14] }, then: '11-13 years' },
                  { case: { $lt: ['$age', 17] }, then: '14-16 years' }
                ],
                default: '17+ years'
              }
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Student report retrieved successfully',
      data: {
        summary: totalStats[0] || { total: 0, active: 0, inactive: 0 },
        classStats,
        transportStats,
        admissionTrend,
        ageDistribution,
        generatedAt: new Date()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get student report error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving student report'
    };
    res.status(500).json(response);
  }
});

// @desc    Get staff report
// @route   GET /api/reports/staff
// @access  Private
router.get('/staff', checkPermission('reports', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const [
      totalStats,
      departmentStats,
      salaryStats,
      experienceStats
    ] = await Promise.all([
      // Total Statistics
      Staff.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            totalSalary: { $sum: '$salary' },
            avgSalary: { $avg: '$salary' }
          }
        }
      ]),

      // Department-wise Statistics
      Staff.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            totalSalary: { $sum: '$salary' },
            avgSalary: { $avg: '$salary' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Salary Distribution
      Staff.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$salary', 20000] }, then: 'Below 20K' },
                  { case: { $lt: ['$salary', 40000] }, then: '20K-40K' },
                  { case: { $lt: ['$salary', 60000] }, then: '40K-60K' },
                  { case: { $lt: ['$salary', 80000] }, then: '60K-80K' }
                ],
                default: 'Above 80K'
              }
            },
            count: { $sum: 1 }
          }
        }
      ]),

      // Experience Distribution
      Staff.aggregate([
        { $match: filter },
        {
          $addFields: {
            experience: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfJoining'] },
                  365.25 * 24 * 60 * 60 * 1000
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$experience', 1] }, then: 'Less than 1 year' },
                  { case: { $lt: ['$experience', 3] }, then: '1-3 years' },
                  { case: { $lt: ['$experience', 5] }, then: '3-5 years' },
                  { case: { $lt: ['$experience', 10] }, then: '5-10 years' }
                ],
                default: '10+ years'
              }
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Staff report retrieved successfully',
      data: {
        summary: totalStats[0] || { total: 0, active: 0, totalSalary: 0, avgSalary: 0 },
        departmentStats,
        salaryStats,
        experienceStats,
        generatedAt: new Date()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get staff report error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving staff report'
    };
    res.status(500).json(response);
  }
});

// @desc    Get fee collection report
// @route   GET /api/reports/fees
// @access  Private
router.get('/fees', checkPermission('reports', 'read'), validateQuery(dateRangeSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const dateFilter = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };

    const [
      totalCollection,
      feeTypeStats,
      paymentMethodStats,
      classWiseStats,
      dailyCollection
    ] = await Promise.all([
      // Total Collection
      FeePayment.aggregate([
        { $match: { ...filter, paymentDate: dateFilter } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]),

      // Fee Type Statistics
      FeePayment.aggregate([
        { $match: { ...filter, paymentDate: dateFilter } },
        {
          $group: {
            _id: '$feeType',
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),

      // Payment Method Statistics
      FeePayment.aggregate([
        { $match: { ...filter, paymentDate: dateFilter } },
        {
          $group: {
            _id: '$paymentMethod',
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]),

      // Class-wise Statistics
      FeePayment.aggregate([
        { $match: { ...filter, paymentDate: dateFilter } },
        {
          $group: {
            _id: '$class',
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),

      // Daily Collection Trend
      FeePayment.aggregate([
        { $match: { ...filter, paymentDate: dateFilter } },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' },
              day: { $dayOfMonth: '$paymentDate' }
            },
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Fee collection report retrieved successfully',
      data: {
        period: { startDate, endDate },
        summary: totalCollection[0] || { totalAmount: 0, totalTransactions: 0 },
        feeTypeStats,
        paymentMethodStats,
        classWiseStats,
        dailyCollection,
        generatedAt: new Date()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get fee collection report error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving fee collection report'
    };
    res.status(500).json(response);
  }
});

// @desc    Get fee dues report (pending/overdue fees)
// @route   GET /api/reports/fee-dues
// @access  Private
router.get('/fee-dues', checkPermission('reports', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const filter: any = { status: 'pending' };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    // Optional filters
    if (req.query.classId) {
      filter.classId = req.query.classId;
    }
    if (req.query.divisionId) {
      filter.divisionId = req.query.divisionId;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get all pending fee payments with student details
    const [pendingFees, total] = await Promise.all([
      FeePayment.find(filter)
        .populate('studentId', 'admissionNo name class section guardianPhone guardianEmail')
        .populate('classId', 'name')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit),
      FeePayment.countDocuments(filter)
    ]);

    // Calculate aging buckets
    const currentDate = new Date();
    const dues = pendingFees.map(fee => {
      const paymentDate = new Date(fee.paymentDate);
      const daysDue = Math.floor((currentDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let agingBucket = 'Not Due Yet';
      if (daysDue > 0 && daysDue <= 30) {
        agingBucket = '1-30 Days';
      } else if (daysDue > 30 && daysDue <= 60) {
        agingBucket = '31-60 Days';
      } else if (daysDue > 60 && daysDue <= 90) {
        agingBucket = '61-90 Days';
      } else if (daysDue > 90) {
        agingBucket = '90+ Days';
      }

      return {
        _id: fee._id,
        student: fee.studentId,
        class: fee.classId,
        className: fee.className,
        amount: fee.amount || fee.totalAmount || 0,
        paymentDate: fee.paymentDate,
        feeType: fee.feeType,
        remarks: fee.remarks,
        daysDue,
        agingBucket,
        isOverdue: daysDue > 0,
      };
    });

    // Calculate summary statistics (across all records, not just current page)
    const allPendingFees = await FeePayment.find(filter);
    const allDues = allPendingFees.map(fee => {
      const paymentDate = new Date(fee.paymentDate);
      const daysDue = Math.floor((currentDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let agingBucket = 'Not Due Yet';
      if (daysDue > 0 && daysDue <= 30) {
        agingBucket = '1-30 Days';
      } else if (daysDue > 30 && daysDue <= 60) {
        agingBucket = '31-60 Days';
      } else if (daysDue > 60 && daysDue <= 90) {
        agingBucket = '61-90 Days';
      } else if (daysDue > 90) {
        agingBucket = '90+ Days';
      }

      return {
        amount: fee.amount || fee.totalAmount || 0,
        daysDue,
        agingBucket,
        isOverdue: daysDue > 0,
      };
    });
    const totalDueAmount = allDues.reduce((sum, due) => sum + (due.amount || 0), 0);
    const overdueAmount = allDues.filter(d => d.isOverdue).reduce((sum, due) => sum + (due.amount || 0), 0);
    const totalStudents = new Set(allPendingFees.map(f => f.studentId?.toString())).size;

    // Aging analysis
    const agingAnalysis = {
      'Not Due Yet': { count: 0, amount: 0 },
      '1-30 Days': { count: 0, amount: 0 },
      '31-60 Days': { count: 0, amount: 0 },
      '61-90 Days': { count: 0, amount: 0 },
      '90+ Days': { count: 0, amount: 0 },
    };

    allDues.forEach(due => {
      agingAnalysis[due.agingBucket as keyof typeof agingAnalysis].count++;
      agingAnalysis[due.agingBucket as keyof typeof agingAnalysis].amount += (due.amount || 0);
    });

    // Class-wise breakdown
    const classWiseData = await FeePayment.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: '$classInfo' },
      {
        $group: {
          _id: '$classInfo.name',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Fee dues report fetched successfully',
      data: {
        dues,
        summary: {
          totalDueAmount,
          overdueAmount,
          totalStudents,
          totalRecords: total,
          overdueRecords: allDues.filter(d => d.isOverdue).length,
        },
        agingAnalysis,
        classWiseBreakdown: classWiseData.map((item: any) => ({
          class: item._id,
          count: item.count,
          amount: item.amount,
        })),
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Get fee dues report error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving fee dues report'
    };
    res.status(500).json(response);
  }
});

// @desc    Get transport report
// @route   GET /api/reports/transport
// @access  Private
router.get('/transport', checkPermission('reports', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const transportType = req.query.transportType as string; // 'school', 'own', 'none'
    
    const filter: any = { status: 'active' };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    // Filter by transport type if specified
    if (transportType && ['school', 'own', 'none'].includes(transportType)) {
      filter.transport = transportType;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get paginated students with transport information
    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('classId', 'name')
        .populate('divisionId', 'name')
        .populate('transportRouteId', 'routeName vehicleNumber driverName')
        .select('admissionNo firstName middleName lastName class division transport transportRouteId guardianContact')
        .sort({ class: 1, division: 1, lastName: 1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(filter)
    ]);

    // Get all students for statistics (without pagination)
    const allStudentsFilter: any = { status: 'active' };
    if (req.user!.role !== 'super_admin') {
      allStudentsFilter.branchId = req.user!.branchId;
    }
    
    const allStudents = await Student.find(allStudentsFilter)
      .populate('classId', 'name')
      .select('transport classId transportRoute admissionNo name class section guardianPhone');

    // Transport statistics
    const transportStats = {
      total: allStudents.length,
      schoolTransport: allStudents.filter(s => s.transport === 'school').length,
      ownTransport: allStudents.filter(s => s.transport === 'own').length,
      noTransport: allStudents.filter(s => s.transport === 'none').length,
    };

    // Route-wise breakdown
    const routeWiseData = allStudents
      .filter(s => s.transport === 'school' && s.transportRoute)
      .reduce((acc: any, student) => {
        const routeName = student.transportRoute || 'Unknown';
        
        if (!acc[routeName]) {
          acc[routeName] = {
            routeName,
            students: [],
            count: 0,
          };
        }
        
        acc[routeName].count++;
        
        return acc;
      }, {});

    // Class-wise transport breakdown
    const classWiseData = allStudents.reduce((acc: any, student) => {
      const className = (student.classId as any)?.name || 'Unknown';
      if (!acc[className]) {
        acc[className] = {
          total: 0,
          schoolTransport: 0,
          ownTransport: 0,
          noTransport: 0,
        };
      }
      acc[className].total++;
      if (student.transport === 'school') acc[className].schoolTransport++;
      else if (student.transport === 'own') acc[className].ownTransport++;
      else acc[className].noTransport++;
      return acc;
    }, {});

    const response: ApiResponse = {
      success: true,
      message: 'Transport report fetched successfully',
      data: {
        statistics: transportStats,
        routeWiseBreakdown: Object.values(routeWiseData),
        classWiseBreakdown: Object.entries(classWiseData).map(([className, data]: [string, any]) => ({
          class: className,
          ...data,
        })),
        students: {
          schoolTransport: students.filter(s => s.transport === 'school').map(s => ({
            admissionNo: s.admissionNo,
            name: s.name,
            class: s.class,
            division: s.section,
            route: s.transportRoute || 'Not Assigned',
            guardianContact: s.guardianPhone,
          })),
          ownTransport: students.filter(s => s.transport === 'own').map(s => ({
            admissionNo: s.admissionNo,
            name: s.name,
            class: s.class,
            division: s.section,
            guardianContact: s.guardianPhone,
          })),
        },
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Get transport report error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving transport report'
    };
    res.status(500).json(response);
  }
});

export default router;