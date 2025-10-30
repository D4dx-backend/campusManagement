import Joi from 'joi';

export const loginSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be 10 digits',
      'any.required': 'Mobile number is required'
    }),
  pin: Joi.string()
    .min(4)
    .max(6)
    .required()
    .messages({
      'string.min': 'PIN must be at least 4 characters',
      'string.max': 'PIN must not exceed 6 characters',
      'any.required': 'PIN is required'
    })
});

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be 10 digits',
      'any.required': 'Mobile number is required'
    }),
  pin: Joi.string()
    .min(4)
    .max(6)
    .required()
    .messages({
      'string.min': 'PIN must be at least 4 characters',
      'string.max': 'PIN must not exceed 6 characters',
      'any.required': 'PIN is required'
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 50 characters',
      'any.required': 'Name is required'
    }),
  role: Joi.string()
    .valid('super_admin', 'branch_admin', 'accountant', 'teacher', 'staff')
    .required()
    .messages({
      'any.only': 'Role must be one of: super_admin, branch_admin, accountant, teacher, staff',
      'any.required': 'Role is required'
    }),
  branchId: Joi.string()
    .optional() // Made optional - will be validated in the route handler based on current user role
    .messages({
      'any.required': 'Branch ID is required'
    }),
  permissions: Joi.array()
    .items(
      Joi.object({
        module: Joi.string().required(),
        actions: Joi.array().items(Joi.string().valid('create', 'read', 'update', 'delete')).required()
      })
    )
    .default([]),
  status: Joi.string()
    .valid('active', 'inactive')
    .default('active')
    .messages({
      'any.only': 'Status must be either active or inactive'
    })
});

export const changePasswordSchema = Joi.object({
  currentPin: Joi.string()
    .min(4)
    .max(6)
    .required()
    .messages({
      'string.min': 'Current PIN must be at least 4 characters',
      'string.max': 'Current PIN must not exceed 6 characters',
      'any.required': 'Current PIN is required'
    }),
  newPin: Joi.string()
    .min(4)
    .max(6)
    .required()
    .messages({
      'string.min': 'New PIN must be at least 4 characters',
      'string.max': 'New PIN must not exceed 6 characters',
      'any.required': 'New PIN is required'
    })
});