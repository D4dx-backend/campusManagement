import Joi from 'joi';

export const markAttendanceSchema = Joi.object({
  date: Joi.date().required().messages({
    'any.required': 'Attendance date is required.',
    'date.base': 'Please enter a valid date.',
  }),
  classId: Joi.string().required().messages({
    'any.required': 'Class is required. Please select a class.',
    'string.empty': 'Class cannot be empty.',
  }),
  section: Joi.string().optional().allow('').default(''),
  academicYear: Joi.string().required().messages({
    'any.required': 'Academic Year is required.',
    'string.empty': 'Academic Year cannot be empty.',
  }),
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.string().required(),
      status: Joi.string().valid('present', 'absent', 'late', 'half_day').required(),
    })
  ).min(1).required().messages({
    'array.min': 'At least one student attendance record is required.',
    'any.required': 'Attendance records are required.',
  }),
});

export const queryAttendanceSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(0).default(50),
  classId: Joi.string().optional(),
  section: Joi.string().optional().allow(''),
  date: Joi.date().optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2000).max(2100).optional(),
  studentId: Joi.string().optional(),
  branchId: Joi.string().optional(),
  sortBy: Joi.string().optional().default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
});

export const createLeaveRequestSchema = Joi.object({
  studentId: Joi.string().required().messages({
    'any.required': 'Student is required. Please select a student.',
    'string.empty': 'Student cannot be empty.',
  }),
  fromDate: Joi.date().required().messages({
    'any.required': 'From Date is required.',
    'date.base': 'Please enter a valid From Date.',
  }),
  toDate: Joi.date().min(Joi.ref('fromDate')).required().messages({
    'any.required': 'To Date is required.',
    'date.base': 'Please enter a valid To Date.',
    'date.min': 'To Date must be on or after the From Date.',
  }),
  reason: Joi.string().min(3).max(500).required().trim().messages({
    'any.required': 'Reason is required.',
    'string.empty': 'Reason cannot be empty.',
    'string.min': 'Reason must be at least 3 characters.',
    'string.max': 'Reason must not exceed 500 characters.',
  }),
});

export const reviewLeaveRequestSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required().messages({
    'any.required': 'Decision is required. Please select Approve or Reject.',
    'any.only': 'Decision must be either Approved or Rejected.',
  }),
  reviewNote: Joi.string().max(500).optional().allow('').trim(),
});

export const queryLeaveRequestSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(0).default(20),
  classId: Joi.string().optional(),
  studentId: Joi.string().optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  branchId: Joi.string().optional(),
  sortBy: Joi.string().optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
});
