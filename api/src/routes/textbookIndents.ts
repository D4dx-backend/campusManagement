import express from 'express';
import { TextbookIndent } from '../models/TextbookIndent';
import { TextBook } from '../models/TextBook';
import { Student } from '../models/Student';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import Joi from 'joi';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const createTextbookIndentSchema = Joi.object({
  studentId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      textbookId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  paymentMethod: Joi.string().valid('cash', 'bank', 'online', 'adjustment').required(),
  paidAmount: Joi.number().min(0).default(0),
  expectedReturnDate: Joi.date().iso().optional(),
  remarks: Joi.string().allow('').optional().trim()
});

const updateTextbookIndentSchema = Joi.object({
  paymentMethod: Joi.string().valid('cash', 'bank', 'online', 'adjustment').optional(),
  paidAmount: Joi.number().min(0).optional(),
  expectedReturnDate: Joi.date().optional(),
  remarks: Joi.string().optional().trim(),
  status: Joi.string().valid('pending', 'issued', 'partially_returned', 'returned', 'cancelled').optional()
});

const returnTextbooksSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      itemId: Joi.string().required(),
      returnedQuantity: Joi.number().integer().min(1).required(),
      condition: Joi.string().valid('good', 'fair', 'poor', 'damaged', 'lost').required(),
      remarks: Joi.string().optional().trim()
    })
  ).min(1).required()
});

const queryTextbookIndentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional().trim(),
  studentId: Joi.string().allow('').optional().trim(),
  status: Joi.string().valid('pending', 'issued', 'partially_returned', 'returned', 'cancelled', '').optional(),
  paymentStatus: Joi.string().valid('pending', 'partial', 'paid', '').optional(),
  class: Joi.string().allow('').optional().trim(),
  academicYear: Joi.string().allow('').optional().trim(),
  dateFrom: Joi.string().allow('').optional(),
  dateTo: Joi.string().allow('').optional(),
  overdue: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '')).optional(),
  sortBy: Joi.string().valid('indentNo', 'studentName', 'issueDate', 'totalAmount', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
}).options({ allowUnknown: true });

// Generate unique indent number
const generateIndentNo = async (branchId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `TBI${currentYear}`;
  
  const lastIndent = await TextbookIndent.findOne(
    { branchId, indentNo: { $regex: `^${prefix}` } },
    {},
    { sort: { indentNo: -1 } }
  );

  let nextNumber = 1;
  if (lastIndent) {
    const lastNumber = parseInt(lastIndent.indentNo.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

// @desc    Get all textbook indents
// @route   GET /api/textbook-indents
// @access  Private
router.get('/', checkPermission('textbooks', 'read'), validateQuery(queryTextbookIndentsSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      studentId = '',
      status = '',
      paymentStatus = '',
      class: indentClass = '',
      academicYear = '',
      dateFrom,
      dateTo,
      overdue,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Type cast query parameters
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const searchStr = String(search || '');
    const studentIdStr = String(studentId || '');
    const statusStr = String(status || '');
    const paymentStatusStr = String(paymentStatus || '');
    const classStr = String(indentClass || '');
    const academicYearStr = String(academicYear || '');
    const dateFromStr = dateFrom ? String(dateFrom) : '';
    const dateToStr = dateTo ? String(dateTo) : '';
    const overdueVal = String(overdue) === 'true';
    const sortByStr = String(sortBy);
    const sortOrderStr = String(sortOrder);

    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    // Search filter
    if (searchStr) {
      filter.$or = [
        { indentNo: { $regex: searchStr, $options: 'i' } },
        { studentName: { $regex: searchStr, $options: 'i' } },
        { admissionNo: { $regex: searchStr, $options: 'i' } }
      ];
    }

    // Student filter
    if (studentIdStr) {
      filter.studentId = studentIdStr;
    }

    // Status filters
    if (statusStr) {
      filter.status = statusStr;
    }

    if (paymentStatusStr) {
      filter.paymentStatus = paymentStatusStr;
    }

    if (classStr) {
      filter.class = classStr;
    }

    if (academicYearStr) {
      filter.academicYear = academicYearStr;
    }

    // Date range filters
    if (dateFromStr || dateToStr) {
      filter.issueDate = {};
      if (dateFromStr) {
        filter.issueDate.$gte = new Date(dateFromStr);
      }
      if (dateToStr) {
        filter.issueDate.$lte = new Date(dateToStr);
      }
    }

    // Overdue filter
    if (overdueVal) {
      filter.status = { $in: ['issued', 'partially_returned'] };
      filter.expectedReturnDate = { $lt: new Date() };
    }

    // Sorting
    const sortOptions: any = {};
    sortOptions[sortByStr] = sortOrderStr === 'desc' ? -1 : 1;

    // Pagination
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [indents, total] = await Promise.all([
      TextbookIndent.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      TextbookIndent.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Textbook indents retrieved successfully',
      data: indents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get textbook indents error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving textbook indents'
    };
    res.status(500).json(response);
  }
});

// @desc    Get textbook indent statistics
// @route   GET /api/textbook-indents/stats/overview
// @access  Private
router.get('/stats/overview', checkPermission('textbooks', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [
      totalIndents,
      pendingIndents,
      issuedIndents,
      returnedIndents,
      overdueIndents,
      totalValue,
      pendingPayments,
      monthlyStats,
      classStats
    ] = await Promise.all([
      TextbookIndent.countDocuments(filter),
      TextbookIndent.countDocuments({ ...filter, status: 'pending' }),
      TextbookIndent.countDocuments({ ...filter, status: { $in: ['issued', 'partially_returned'] } }),
      TextbookIndent.countDocuments({ ...filter, status: 'returned' }),
      TextbookIndent.countDocuments({
        ...filter,
        status: { $in: ['issued', 'partially_returned'] },
        expectedReturnDate: { $lt: currentDate }
      }),
      TextbookIndent.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      TextbookIndent.aggregate([
        { $match: { ...filter, paymentStatus: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$balanceAmount' } } }
      ]),
      TextbookIndent.aggregate([
        { $match: { ...filter, createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            indents: { $sum: 1 },
            value: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      TextbookIndent.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$class',
            indents: { $sum: 1 },
            value: { $sum: '$totalAmount' }
          }
        },
        { $sort: { indents: -1 } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Textbook indent statistics retrieved successfully',
      data: {
        totalIndents,
        pendingIndents,
        issuedIndents,
        returnedIndents,
        overdueIndents,
        totalValue: totalValue[0]?.total || 0,
        pendingPayments: pendingPayments[0]?.total || 0,
        monthlyStats: monthlyStats.map(stat => ({
          month: stat._id,
          indents: stat.indents,
          value: stat.value
        })),
        classStats: classStats.map(stat => ({
          class: stat._id,
          indents: stat.indents,
          value: stat.value
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get textbook indent stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving textbook indent statistics'
    };
    res.status(500).json(response);
  }
});

// @desc    Get textbook indent by ID
// @route   GET /api/textbook-indents/:id
// @access  Private
router.get('/:id', checkPermission('textbooks', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const indent = await TextbookIndent.findOne(filter);

    if (!indent) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook indent not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Textbook indent retrieved successfully',
      data: indent
    };

    res.json(response);
  } catch (error) {
    console.error('Get textbook indent error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving textbook indent'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new textbook indent
// @route   POST /api/textbook-indents
// @access  Private
router.post('/', checkPermission('textbooks', 'create'), validate(createTextbookIndentSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, items, paymentMethod, paidAmount = 0, expectedReturnDate, remarks } = req.body;

    // Validate user has branchId
    if (!req.user!.branchId && req.user!.role !== 'super_admin') {
      const response: ApiResponse = {
        success: false,
        message: 'User branch information is missing. Please contact administrator.'
      };
      return res.status(400).json(response);
    }

    // Get student details
    const studentFilter: any = { _id: studentId };
    
    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      studentFilter.branchId = req.user!.branchId;
    }
    
    const student = await Student.findOne(studentFilter);
    
    if (!student) {
      const response: ApiResponse = {
        success: false,
        message: 'Student not found'
      };
      return res.status(404).json(response);
    }

    // Get textbook details and validate availability
    const textbookIds = items.map((item: any) => item.textbookId);
    const textbookFilter: any = { _id: { $in: textbookIds } };
    
    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      textbookFilter.branchId = req.user!.branchId;
    }
    
    const textbooks = await TextBook.find(textbookFilter);

    if (textbooks.length !== items.length) {
      const response: ApiResponse = {
        success: false,
        message: 'One or more textbooks not found'
      };
      return res.status(404).json(response);
    }

    // Check availability and calculate total
    let totalAmount = 0;
    const indentItems = [];

    for (const item of items) {
      const textbook = textbooks.find(t => t._id.toString() === item.textbookId);
      if (!textbook) continue;

      if (textbook.available < item.quantity) {
        const response: ApiResponse = {
          success: false,
          message: `Insufficient stock for ${textbook.title}. Available: ${textbook.available}, Requested: ${item.quantity}`
        };
        return res.status(400).json(response);
      }

      const itemTotal = textbook.price * item.quantity;
      totalAmount += itemTotal;

      indentItems.push({
        textbookId: textbook._id.toString(),
        bookCode: textbook.bookCode,
        title: textbook.title,
        subject: textbook.subject,
        publisher: textbook.publisher,
        price: textbook.price,
        quantity: item.quantity,
        returnedQuantity: 0,
        status: 'issued',
        issueDate: new Date()
      });
    }

    // Generate indent number
    const indentNo = await generateIndentNo(req.user!.branchId!.toString());

    // Calculate balance amount
    const balanceAmount = totalAmount - paidAmount;
    const paymentStatus = balanceAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending');

    // Create indent
    const indentData = {
      indentNo,
      studentId: student._id.toString(),
      studentName: student.name,
      admissionNo: student.admissionNo,
      class: student.class,
      division: student.section,
      academicYear: new Date().getFullYear().toString(),
      items: indentItems,
      totalAmount,
      paymentMethod,
      paymentStatus,
      paidAmount,
      balanceAmount,
      issueDate: new Date(),
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
      status: 'pending',
      issuedBy: req.user!._id.toString(),
      issuedByName: req.user!.name,
      remarks,
      receiptGenerated: false,
      branchId: req.user!.branchId || req.user!._id // Fallback to user ID if branchId is not set
    };

    
    const indent = new TextbookIndent(indentData);
    
    await indent.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'textbook_indents',
      details: `Created textbook indent ${indentNo} for student ${student.name}`,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Textbook indent created successfully',
      data: indent
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create textbook indent error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const response: ApiResponse = {
        success: false,
        message: `Validation error: ${error.message}`
      };
      return res.status(400).json(response);
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Indent number already exists. Please try again.'
      };
      return res.status(400).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: `Server error creating textbook indent: ${error.message || 'Unknown error'}`
    };
    res.status(500).json(response);
  }
});

// @desc    Issue textbook indent (update stock)
// @route   PUT /api/textbook-indents/:id/issue
// @access  Private
router.put('/:id/issue', checkPermission('textbooks', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid indent ID format'
      };
      return res.status(400).json(response);
    }
    
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const indent = await TextbookIndent.findOne(filter);

    if (!indent) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook indent not found'
      };
      return res.status(404).json(response);
    }

    if (indent.status !== 'pending') {
      const response: ApiResponse = {
        success: false,
        message: 'Only pending indents can be issued'
      };
      return res.status(400).json(response);
    }

    // Update textbook stock
    for (const item of indent.items) {
      await TextBook.findByIdAndUpdate(
        item.textbookId,
        { $inc: { available: -item.quantity } }
      );
    }

    // Update indent status
    indent.status = 'issued';
    await indent.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'textbook_indents',
      details: `Issued textbook indent ${indent.indentNo}`,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Textbook indent issued successfully',
      data: indent
    };

    res.json(response);
  } catch (error) {
    console.error('Issue textbook indent error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    const response: ApiResponse = {
      success: false,
      message: `Server error issuing textbook indent: ${error.message || 'Unknown error'}`
    };
    res.status(500).json(response);
  }
});

// @desc    Return textbooks
// @route   PUT /api/textbook-indents/:id/return
// @access  Private
router.put('/:id/return', checkPermission('textbooks', 'update'), validate(returnTextbooksSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { items: returnItems } = req.body;
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const indent = await TextbookIndent.findOne(filter);

    if (!indent) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook indent not found'
      };
      return res.status(404).json(response);
    }

    if (indent.status !== 'issued' && indent.status !== 'partially_returned') {
      const response: ApiResponse = {
        success: false,
        message: 'Only issued or partially returned indents can have returns processed'
      };
      return res.status(400).json(response);
    }

    // Process returns
    for (const returnItem of returnItems) {
      const itemIndex = indent.items.findIndex(item => 
        item._id?.toString() === returnItem.itemId || 
        indent.items.indexOf(item).toString() === returnItem.itemId
      );
      
      if (itemIndex === -1) {
        const response: ApiResponse = {
          success: false,
          message: `Item with ID ${returnItem.itemId} not found in indent`
        };
        return res.status(404).json(response);
      }

      const indentItem = indent.items[itemIndex];

      const maxReturnable = indentItem.quantity - indentItem.returnedQuantity;
      if (returnItem.returnedQuantity > maxReturnable) {
        const response: ApiResponse = {
          success: false,
          message: `Cannot return ${returnItem.returnedQuantity} of ${indentItem.title}. Maximum returnable: ${maxReturnable}`
        };
        return res.status(400).json(response);
      }

      // Update item
      indentItem.returnedQuantity += returnItem.returnedQuantity;
      indentItem.condition = returnItem.condition;
      indentItem.returnDate = new Date();
      indentItem.remarks = returnItem.remarks;

      // Update item status
      if (indentItem.returnedQuantity === indentItem.quantity) {
        indentItem.status = 'returned';
      } else {
        indentItem.status = 'partially_returned';
      }

      // Update textbook stock (only for good condition books)
      if (returnItem.condition === 'good' || returnItem.condition === 'fair') {
        await TextBook.findByIdAndUpdate(
          indentItem.textbookId,
          { $inc: { available: returnItem.returnedQuantity } }
        );
      }
    }

    // Update overall indent status
    const allReturned = indent.items.every(item => item.status === 'returned');
    const someReturned = indent.items.some(item => item.returnedQuantity > 0);

    if (allReturned) {
      indent.status = 'returned';
    } else if (someReturned) {
      indent.status = 'partially_returned';
    }

    await indent.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'textbook_indents',
      details: `Processed return for textbook indent ${indent.indentNo}`,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Textbook return processed successfully',
      data: indent
    };

    res.json(response);
  } catch (error) {
    console.error('Return textbooks error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error processing textbook return'
    };
    res.status(500).json(response);
  }
});

// @desc    Cancel textbook indent
// @route   PUT /api/textbook-indents/:id/cancel
// @access  Private
router.put('/:id/cancel', checkPermission('textbooks', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid indent ID format'
      };
      return res.status(400).json(response);
    }
    
    const { reason } = req.body;
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const indent = await TextbookIndent.findOne(filter);

    if (!indent) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook indent not found'
      };
      return res.status(404).json(response);
    }

    if (indent.status !== 'pending') {
      const response: ApiResponse = {
        success: false,
        message: 'Only pending indents can be cancelled'
      };
      return res.status(400).json(response);
    }

    // Update indent
    indent.status = 'cancelled';
    indent.remarks = reason || indent.remarks;
    await indent.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'textbook_indents',
      details: `Cancelled textbook indent ${indent.indentNo}. Reason: ${reason}`,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Textbook indent cancelled successfully',
      data: indent
    };

    res.json(response);
  } catch (error) {
    console.error('Cancel textbook indent error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    const response: ApiResponse = {
      success: false,
      message: `Server error cancelling textbook indent: ${error.message || 'Unknown error'}`
    };
    res.status(500).json(response);
  }
});

// @desc    Generate receipt for textbook indent
// @route   POST /api/textbook-indents/:id/receipt
// @access  Private
router.post('/:id/receipt', checkPermission('textbooks', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid indent ID format'
      };
      return res.status(400).json(response);
    }
    
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const indent = await TextbookIndent.findOne(filter);

    if (!indent) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook indent not found'
      };
      return res.status(404).json(response);
    }

    // Only generate receipts for issued or returned indents
    if (!['issued', 'partially_returned', 'returned'].includes(indent.status)) {
      const response: ApiResponse = {
        success: false,
        message: 'Receipts can only be generated for issued or returned indents'
      };
      return res.status(400).json(response);
    }

    // Mark receipt as generated
    indent.receiptGenerated = true;
    await indent.save();

    // Prepare receipt data
    const receiptData = {
      indentNo: indent.indentNo,
      studentName: indent.studentName,
      admissionNo: indent.admissionNo,
      class: indent.class,
      division: indent.division,
      items: indent.items.map(item => ({
        title: item.title,
        bookCode: item.bookCode,
        subject: item.subject,
        quantity: item.quantity,
        returnedQuantity: item.returnedQuantity,
        price: item.price,
        total: item.price * item.quantity,
        status: item.status
      })),
      totalAmount: indent.totalAmount,
      paidAmount: indent.paidAmount,
      balanceAmount: indent.balanceAmount,
      paymentMethod: indent.paymentMethod,
      issueDate: indent.issueDate,
      expectedReturnDate: indent.expectedReturnDate,
      issuedBy: indent.issuedByName,
      remarks: indent.remarks,
      status: indent.status,
      generatedAt: new Date(),
      generatedBy: req.user!.name
    };

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'textbook_indents',
      details: `Generated receipt for textbook indent ${indent.indentNo}`,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Receipt generated successfully',
      data: receiptData
    };

    res.json(response);
  } catch (error) {
    console.error('Generate receipt error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    const response: ApiResponse = {
      success: false,
      message: `Server error generating receipt: ${error.message || 'Unknown error'}`
    };
    res.status(500).json(response);
  }
});

export default router;