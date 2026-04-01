import Joi from 'joi';

export const createStudentSchema = Joi.object({
  admissionNo: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Admission number is required'
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required'
    }),
  class: Joi.string()
    .required()
    .messages({
      'any.required': 'Class is required'
    }),
  section: Joi.string()
    .optional()
    .allow('')
    .trim(),
  dateOfBirth: Joi.date()
    .required()
    .messages({
      'any.required': 'Date of birth is required'
    }),
  dateOfAdmission: Joi.date()
    .required()
    .messages({
      'any.required': 'Date of admission is required'
    }),
  fatherName: Joi.string().min(2).max(100).required().trim()
    .messages({ 'any.required': "Father's name is required" }),
  fatherPhone: Joi.string().pattern(/^\+\d{1,4}\d{6,14}$/).required()
    .messages({ 'string.pattern.base': "Father's phone must include country code (e.g., +911234567890)", 'any.required': "Father's phone is required" }),
  fatherEmail: Joi.string().email().optional().allow(''),
  fatherJobCompany: Joi.string().optional().allow('').trim(),
  motherName: Joi.string().min(2).max(100).optional().allow('').trim(),
  motherPhone: Joi.string().pattern(/^\+\d{1,4}\d{6,14}$/).optional().allow('')
    .messages({ 'string.pattern.base': "Mother's phone must include country code (e.g., +911234567890)" }),
  motherEmail: Joi.string().email().optional().allow(''),
  motherJobCompany: Joi.string().optional().allow('').trim(),
  // legacy guardian fields allowed for backward compatibility
  guardianName: Joi.string().min(2).max(100).optional().allow('').trim(),
  guardianPhone: Joi.string().pattern(/^\+\d{1,4}\d{6,14}$/).optional().allow(''),
  guardianEmail: Joi.string().email().optional().allow(''),
  gender: Joi.string()
    .valid('male', 'female')
    .required()
    .messages({
      'any.only': 'Gender must be either male or female',
      'any.required': 'Gender is required'
    }),
  address: Joi.string()
    .min(10)
    .max(500)
    .required()
    .trim()
    .messages({
      'string.min': 'Address must be at least 10 characters',
      'string.max': 'Address must not exceed 500 characters',
      'any.required': 'Address is required'
    }),
  transport: Joi.string()
    .valid('school', 'own', 'none')
    .default('none')
    .messages({
      'any.only': 'Transport must be one of: school, own, none'
    }),
  transportRoute: Joi.string()
    .optional()
    .allow('')
    .trim(),
  isStaffChild: Joi.boolean().optional().default(false),
  status: Joi.string()
    .valid('active', 'inactive')
    .default('active')
    .messages({
      'any.only': 'Status must be either active or inactive'
    })
});

export const updateStudentSchema = Joi.object({
  admissionNo: Joi.string()
    .optional()
    .trim()
    .messages({
      'any.required': 'Admission number is required'
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters'
    }),
  class: Joi.string()
    .optional(),
  section: Joi.string()
    .optional()
    .trim(),
  dateOfBirth: Joi.date()
    .optional(),
  dateOfAdmission: Joi.date()
    .optional(),
  fatherName: Joi.string().min(2).max(100).optional().trim(),
  fatherPhone: Joi.string().pattern(/^\+\d{1,4}\d{6,14}$/).optional().allow(''),
  fatherEmail: Joi.string().email().optional().allow(''),
  fatherJobCompany: Joi.string().optional().allow('').trim(),
  motherName: Joi.string().min(2).max(100).optional().allow('').trim(),
  motherPhone: Joi.string().pattern(/^\+\d{1,4}\d{6,14}$/).optional().allow(''),
  motherEmail: Joi.string().email().optional().allow(''),
  motherJobCompany: Joi.string().optional().allow('').trim(),
  guardianName: Joi.string().min(2).max(100).optional().allow('').trim(),
  guardianPhone: Joi.string().pattern(/^\+\d{1,4}\d{6,14}$/).optional().allow(''),
  guardianEmail: Joi.string().email().optional().allow(''),
  gender: Joi.string()
    .valid('male', 'female')
    .optional()
    .messages({
      'any.only': 'Gender must be either male or female'
    }),
  address: Joi.string()
    .min(10)
    .max(500)
    .optional()
    .trim()
    .messages({
      'string.min': 'Address must be at least 10 characters',
      'string.max': 'Address must not exceed 500 characters'
    }),
  transport: Joi.string()
    .valid('school', 'own', 'none')
    .optional()
    .messages({
      'any.only': 'Transport must be one of: school, own, none'
    }),
  transportRoute: Joi.string()
    .optional()
    .allow('')
    .trim(),
  isStaffChild: Joi.boolean().optional(),
  status: Joi.string()
    .valid('active', 'inactive')
    .optional()
    .messages({
      'any.only': 'Status must be either active or inactive'
    })
});

export const queryStudentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  branchId: Joi.string().optional().allow(''),
  class: Joi.string().optional().allow(''),
  classId: Joi.string().optional().allow(''),
  section: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  transport: Joi.string().valid('school', 'own', 'none').optional(),
  gender: Joi.string().valid('male', 'female').optional(),
  sortBy: Joi.string().valid('name', 'admissionNo', 'class', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});