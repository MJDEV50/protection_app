import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Validation rules
export const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name required'),
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().withMessage('Password required'),
];

export const validateAddGuardian = [
  body('name').trim().isLength({ min: 1 }).withMessage('Guardian name required'),
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
];

export const validateLocationUpdate = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
