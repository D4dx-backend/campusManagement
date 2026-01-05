import Joi from 'joi';

export const createTransportRouteSchema = Joi.object({
  routeName: Joi.string()
    .required()
    .trim()
    .max(100)
    .messages({
      'any.required': 'Route name is required',
      'string.max': 'Route name must not exceed 100 characters'
    }),
  routeCode: Joi.string()
    .required()
    .trim()
    .uppercase()
    .max(20)
    .messages({
      'any.required': 'Route code is required',
      'string.max': 'Route code must not exceed 20 characters'
    }),
  description: Joi.string()
    .optional()
    .allow('')
    .trim()
    .max(500)
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
  classFees: Joi.array()
    .items(
      Joi.object({
        classId: Joi.string().required().messages({
          'any.required': 'Class ID is required for each fee'
        }),
        className: Joi.string().required().messages({
          'any.required': 'Class name is required for each fee'
        }),
        amount: Joi.number().min(0).required().messages({
          'any.required': 'Amount is required for each class',
          'number.min': 'Amount must be a positive number'
        }),
        staffDiscount: Joi.number().min(0).max(100).default(0).messages({
          'number.min': 'Staff discount must be at least 0',
          'number.max': 'Staff discount must not exceed 100'
        }),
        distanceGroupFees: Joi.array()
          .items(
            Joi.object({
              groupName: Joi.string().required().messages({
                'any.required': 'Distance group name is required'
              }),
              distanceRange: Joi.string().required().messages({
                'any.required': 'Distance range is required'
              }),
              amount: Joi.number().min(0).required().messages({
                'any.required': 'Amount is required for distance group',
                'number.min': 'Amount must be a positive number'
              })
            })
          )
          .optional()
      })
    )
    .min(1)
    .required()
    .messages({
      'any.required': 'At least one class fee is required',
      'array.min': 'At least one class fee is required'
    }),
  useDistanceGroups: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Use distance groups must be a boolean'
    }),
  vehicles: Joi.array()
    .items(
      Joi.object({
        vehicleNumber: Joi.string().required().trim().messages({
          'any.required': 'Vehicle number is required'
        }),
        driverName: Joi.string().required().trim().messages({
          'any.required': 'Driver name is required'
        }),
        driverPhone: Joi.string().required().trim().messages({
          'any.required': 'Driver phone is required'
        })
      })
    )
    .default([])
    .messages({
      'array.base': 'Vehicles must be an array'
    }),
  status: Joi.string()
    .valid('active', 'inactive')
    .default('active')
    .messages({
      'any.only': 'Status must be either active or inactive'
    })
});

export const updateTransportRouteSchema = Joi.object({
  routeName: Joi.string()
    .optional()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Route name must not exceed 100 characters'
    }),
  routeCode: Joi.string()
    .optional()
    .trim()
    .uppercase()
    .max(20)
    .messages({
      'string.max': 'Route code must not exceed 20 characters'
    }),
  description: Joi.string()
    .optional()
    .allow('')
    .trim()
    .max(500)
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
  classFees: Joi.array()
    .items(
      Joi.object({
        classId: Joi.string().required(),
        className: Joi.string().required(),
        amount: Joi.number().min(0).required(),
        staffDiscount: Joi.number().min(0).max(100).default(0),
        distanceGroupFees: Joi.array()
          .items(
            Joi.object({
              groupName: Joi.string().required(),
              distanceRange: Joi.string().required(),
              amount: Joi.number().min(0).required()
            })
          )
          .optional()
      })
    )
    .optional(),
  useDistanceGroups: Joi.boolean().optional(),
  vehicles: Joi.array()
    .items(
      Joi.object({
        vehicleNumber: Joi.string().required().trim(),
        driverName: Joi.string().required().trim(),
        driverPhone: Joi.string().required().trim()
      })
    )
    .optional(),
  status: Joi.string()
    .valid('active', 'inactive')
    .optional()
    .messages({
      'any.only': 'Status must be either active or inactive'
    })
});

export const queryTransportRoutesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('routeName', 'routeCode', 'createdAt').default('routeName'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});
