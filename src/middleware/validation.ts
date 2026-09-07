import { Request, Response, NextFunction } from 'express';

// Validation error handler - simplified
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next();
};

// Placeholder validators (will enhance later)
export const validateRegister = [];
export const validateLogin = [];
export const validateAddGuardian = [];
export const validateLocationUpdate = [];
