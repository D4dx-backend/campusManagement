import express from 'express';
import { TextBook } from '../models/TextBook';
import { ActivityLog } from '../models/ActivityLog';
import { Class } from '../models/Class';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const createTextBookSchema = Joi.object({
  bookCode: Joi.string().required().trim(),
  title: Joi.string().min(2).max(200).required().trim(),
  subject: Joi.string().required().trim(),
  class: Joi.string().optional().trim(), // Accept class (classId)
  classId: Joi.string().optional().trim(), // Also accept classId
  publisher: Joi.string().required().trim(),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(0).required(),
  academicYear: Joi.string().required().trim()
}).custom((value, helpers) => {
  // Ensure either class or classId is provided
  if (!value.class && !value.classId) {
    return helpers.error('any.required', { label: 'class or classId' });
  }
  return value;
});

const updateTextBookSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional().trim(),
  subject: Joi.string().optional().trim(),
  class: Joi.string().optional().trim(), // Accept class (classId)
  classId: Joi.string().optional().trim(), // Also accept classId
  publisher: Joi.string().optional().trim(),
  price: Joi.number().min(0).optional(),
  quantity: Joi.number().integer().min(0).optional(),
  academicYear: Joi.string().optional().trim()
});

const queryTextBooksSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  class: Joi.string().optional().allow(''),
  subject: Joi.string().optional().allow(''),
  academicYear: Joi.string().optional().allow(''),
  availability: Joi.string().valid('available', 'out_of_stock', 'low_stock').optional(),
  sortBy: Joi.string().valid('title', 'class', 'subject', 'price', 'quantity', 'available', 'createdAt').default('title'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

const issueBookSchema = Joi.object({
  studentId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).default(1)
});

// @desc    Get all textbooks
// @route   GET /api/textbooks
// @access  Private
router.get('/', checkPermission('textbooks', 'read'), validateQuery(queryTextBooksSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      class: bookClass = '',
      subject = '',
      academicYear = '',
      availability = '',
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query as QueryParams;

    // Build filter object
    const filter: any = {};

    // Branch filter (non-super admins can only see their branch data)
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { bookCode: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } }
      ];
    }

    if (bookClass) filter.classId = bookClass;
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (academicYear) filter.academicYear = academicYear;

    // Availability filter
    if (availability === 'available') {
      filter.available = { $gt: 0 };
    } else if (availability === 'out_of_stock') {
      filter.available = 0;
    } else if (availability === 'low_stock') {
      filter.$expr = { $and: [{ $gt: ['$available', 0] }, { $lte: ['$available', { $multiply: ['$quantity', 0.1] }] }] };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [textbooks, total] = await Promise.all([
      TextBook.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      TextBook.countDocuments(filter)
    ]);

    // Add availability status to each book
    const textbooksWithStatus = textbooks.map(book => ({
      ...book,
      availabilityStatus: book.available === 0 ? 'out_of_stock' : 
                         book.available <= (book.quantity * 0.1) ? 'low_stock' : 'available',
      issuedCount: book.quantity - book.available
    }));

    const response: ApiResponse = {
      success: true,
      message: 'Textbooks retrieved successfully',
      data: textbooksWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get textbooks error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving textbooks'
    };
    res.status(500).json(response);
  }
});

// @desc    Get textbook by ID
// @route   GET /api/textbooks/:id
// @access  Private
router.get('/:id', checkPermission('textbooks', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const textbook = await TextBook.findOne(filter);

    if (!textbook) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook not found'
      };
      return res.status(404).json(response);
    }

    const textbookWithStatus = {
      ...textbook.toObject(),
      availabilityStatus: textbook.available === 0 ? 'out_of_stock' : 
                         textbook.available <= (textbook.quantity * 0.1) ? 'low_stock' : 'available',
      issuedCount: textbook.quantity - textbook.available
    };

    const response: ApiResponse = {
      success: true,
      message: 'Textbook retrieved successfully',
      data: textbookWithStatus
    };

    res.json(response);
  } catch (error) {
    console.error('Get textbook error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving textbook'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new textbook
// @route   POST /api/textbooks
// @access  Private
router.post('/', checkPermission('textbooks', 'create'), validate(createTextBookSchema), async (req: AuthenticatedRequest, res) => {
  try {
    // Check if book code already exists
    const existingBook = await TextBook.findOne({ 
      bookCode: req.body.bookCode,
      branchId: req.user!.branchId || req.body.branchId
    });

    if (existingBook) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook with this book code already exists'
      };
      return res.status(400).json(response);
    }

    // Handle class lookup
    const classIdFromPayload = req.body.class || req.body.classId;
    const classInfo = await Class.findById(classIdFromPayload);
    
    if (!classInfo) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid class selected'
      };
      return res.status(400).json(response);
    }

    // Create textbook data
    const textbookData = {
      ...req.body,
      classId: classIdFromPayload,
      class: classInfo.name,
      available: req.body.quantity, // Initially all books are available
      branchId: req.user!.branchId || req.body.branchId
    };

    const textbook = new TextBook(textbookData);
    await textbook.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'TextBooks',
      details: `Added textbook: ${textbook.title} (${textbook.bookCode}) - Qty: ${textbook.quantity}`,
      ipAddress: req.ip,
      branchId: textbook.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Textbook created successfully',
      data: textbook
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create textbook error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating textbook'
    };
    res.status(500).json(response);
  }
});

// @desc    Update textbook
// @route   PUT /api/textbooks/:id
// @access  Private
router.put('/:id', checkPermission('textbooks', 'update'), validate(updateTextBookSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const existingBook = await TextBook.findOne(filter);
    if (!existingBook) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook not found'
      };
      return res.status(404).json(response);
    }

    // Handle class update if provided
    let updateData = { ...req.body };
    if (req.body.class) {
      const classInfo = await Class.findById(req.body.class);
      if (!classInfo) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid class selected'
        };
        return res.status(400).json(response);
      }
      updateData.classId = req.body.class;
      updateData.class = classInfo.name;
    }

    // If quantity is being updated, adjust available count
    if (req.body.quantity !== undefined) {
      const issuedCount = existingBook.quantity - existingBook.available;
      updateData.available = Math.max(0, req.body.quantity - issuedCount);
    }

    const textbook = await TextBook.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'TextBooks',
      details: `Updated textbook: ${textbook!.title} (${textbook!.bookCode})`,
      ipAddress: req.ip,
      branchId: textbook!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Textbook updated successfully',
      data: textbook
    };

    res.json(response);
  } catch (error) {
    console.error('Update textbook error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating textbook'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete textbook
// @route   DELETE /api/textbooks/:id
// @access  Private
router.delete('/:id', checkPermission('textbooks', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const textbook = await TextBook.findOne(filter);
    if (!textbook) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook not found'
      };
      return res.status(404).json(response);
    }

    // Check if any books are currently issued
    const issuedCount = textbook.quantity - textbook.available;
    if (issuedCount > 0) {
      const response: ApiResponse = {
        success: false,
        message: `Cannot delete textbook. ${issuedCount} books are currently issued to students.`
      };
      return res.status(400).json(response);
    }

    await TextBook.findOneAndDelete(filter);

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'TextBooks',
      details: `Deleted textbook: ${textbook.title} (${textbook.bookCode})`,
      ipAddress: req.ip,
      branchId: textbook.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Textbook deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete textbook error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting textbook'
    };
    res.status(500).json(response);
  }
});

// @desc    Get textbook statistics
// @route   GET /api/textbooks/stats/overview
// @access  Private
router.get('/stats/overview', checkPermission('textbooks', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const [
      totalBooks,
      totalTitles,
      availableBooks,
      issuedBooks,
      outOfStockBooks,
      lowStockBooks,
      classStats,
      subjectStats,
      valueStats
    ] = await Promise.all([
      TextBook.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]),
      TextBook.countDocuments(filter),
      TextBook.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$available' } } }
      ]),
      TextBook.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: { $subtract: ['$quantity', '$available'] } } } }
      ]),
      TextBook.countDocuments({ ...filter, available: 0 }),
      TextBook.aggregate([
        { $match: filter },
        { $match: { $expr: { $and: [{ $gt: ['$available', 0] }, { $lte: ['$available', { $multiply: ['$quantity', 0.1] }] }] } } },
        { $count: 'count' }
      ]),
      TextBook.aggregate([
        { $match: filter },
        { $group: { _id: '$class', totalBooks: { $sum: '$quantity' }, availableBooks: { $sum: '$available' }, titles: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      TextBook.aggregate([
        { $match: filter },
        { $group: { _id: '$subject', totalBooks: { $sum: '$quantity' }, availableBooks: { $sum: '$available' }, titles: { $sum: 1 } } },
        { $sort: { totalBooks: -1 } }
      ]),
      TextBook.aggregate([
        { $match: filter },
        { 
          $group: { 
            _id: null, 
            totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
            availableValue: { $sum: { $multiply: ['$available', '$price'] } }
          } 
        }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Textbook statistics retrieved successfully',
      data: {
        totalBooks: totalBooks[0]?.total || 0,
        totalTitles,
        availableBooks: availableBooks[0]?.total || 0,
        issuedBooks: issuedBooks[0]?.total || 0,
        outOfStockBooks,
        lowStockBooks: lowStockBooks[0]?.count || 0,
        classStats,
        subjectStats,
        valueStats: valueStats[0] || { totalValue: 0, availableValue: 0 }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get textbook stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving textbook statistics'
    };
    res.status(500).json(response);
  }
});

// @desc    Update book stock (add/remove inventory)
// @route   PUT /api/textbooks/:id/stock
// @access  Private
router.put('/:id/stock', checkPermission('textbooks', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const { adjustment, reason } = req.body;

    if (!adjustment || typeof adjustment !== 'number') {
      const response: ApiResponse = {
        success: false,
        message: 'Stock adjustment value is required and must be a number'
      };
      return res.status(400).json(response);
    }

    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const textbook = await TextBook.findOne(filter);
    if (!textbook) {
      const response: ApiResponse = {
        success: false,
        message: 'Textbook not found'
      };
      return res.status(404).json(response);
    }

    // Calculate new quantities
    const newQuantity = Math.max(0, textbook.quantity + adjustment);
    const issuedCount = textbook.quantity - textbook.available;
    const newAvailable = Math.max(0, newQuantity - issuedCount);

    // Update textbook
    const updatedTextbook = await TextBook.findOneAndUpdate(
      filter,
      { 
        quantity: newQuantity,
        available: newAvailable
      },
      { new: true, runValidators: true }
    );

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'TextBooks',
      details: `Stock adjustment: ${textbook.title} (${textbook.bookCode}) - ${adjustment > 0 ? '+' : ''}${adjustment} books. Reason: ${reason || 'Not specified'}`,
      ipAddress: req.ip,
      branchId: textbook.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Stock updated successfully',
      data: updatedTextbook
    };

    res.json(response);
  } catch (error) {
    console.error('Update stock error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating stock'
    };
    res.status(500).json(response);
  }
});

export default router;