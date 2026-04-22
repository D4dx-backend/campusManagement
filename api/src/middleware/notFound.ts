import { Request, Response } from 'express';
import { ApiResponse } from '../types';

export const notFound = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: `The requested page or endpoint (${req.originalUrl}) was not found.`
  };

  res.status(404).json(response);
};