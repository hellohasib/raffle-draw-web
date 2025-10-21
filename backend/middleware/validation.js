const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('organization')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Organization must be less than 100 characters'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Raffle draw validation
const validateRaffleDraw = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('drawDate')
    .isISO8601()
    .withMessage('Please provide a valid draw date'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max participants must be a non-negative integer'),
  handleValidationErrors
];

// Prize validation
const validatePrize = [
  body('name')
    .isLength({ min: 1, max: 200 })
    .withMessage('Prize name is required and must be less than 200 characters'),
  body('position')
    .isInt({ min: 1 })
    .withMessage('Position must be a positive integer'),
  body('value')
    .optional()
    .isDecimal()
    .withMessage('Value must be a valid decimal number'),
  handleValidationErrors
];

// Participant validation
const validateParticipant = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters'),
  body('designation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Designation must be less than 100 characters'),
  handleValidationErrors
];

const validateParticipantUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('email')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    })
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional({ nullable: true })
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters'),
  body('designation')
    .optional({ nullable: true })
    .isLength({ max: 100 })
    .withMessage('Designation must be less than 100 characters'),
  body()
    .custom((value) => {
      const allowedFields = ['name', 'email', 'phone', 'designation'];
      const hasFieldToUpdate = allowedFields.some((field) => value[field] !== undefined);
      if (!hasFieldToUpdate) {
        throw new Error('At least one field (name, email, phone, designation) must be provided to update');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateRaffleDraw,
  validatePrize,
  validateParticipant,
  validateParticipantUpdate
};
