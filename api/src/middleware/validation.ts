import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        error: errors.length === 1 ? errors[0].message : 'Multiple validation errors occurred',
        errors: errors.length > 1 ? errors : undefined
      };
      
      res.status(400).json(response);
      return;
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      const response: ApiResponse = {
        success: false,
        message: 'Query validation failed',
        error: errors.length === 1 ? errors[0].message : 'Multiple query validation errors occurred',
        errors: errors.length > 1 ? errors : undefined
      };
      
      res.status(400).json(response);
      return;
    }
    
    // Replace req.query with validated and converted values
    req.query = value;
    next();
  };
};