import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'The requested resource was not found. The provided ID may be invalid.';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const dupField = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `A record with this ${dupField} already exists. Please use a different value.`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    const message = messages.length === 1 ? messages[0] : 'Please fix the following: ' + messages.join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Your session is invalid. Please log in again.';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your session has expired. Please log in again.';
    error = new AppError(message, 401);
  }

  const response: ApiResponse = {
    success: false,
    message: error.message || 'Something went wrong. Please try again.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  res.status(error.statusCode || 500).json(response);
};