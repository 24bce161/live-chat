import { body, validationResult } from 'express-validator';

// Only allow real http(s) links (blocks things like "javascript:" URLs).
// require_tld is off so local URLs like http://localhost:5000/uploads/... still pass.
const URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };

// Username rules shared by signup and profile update
const usernameRules = () =>
  body('name')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_.]+$/).withMessage('Username can only contain letters, numbers, _ and .');

export const validateSignup = [
  usernameRules(),
  body('email').trim().toLowerCase().isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateProfile = [
  usernameRules().optional(),
  body('avatarUrl').optional({ values: 'falsy' }).isURL(URL_OPTIONS).withMessage('Invalid avatar URL')
];

export const validateMessage = [
  body('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  body('text').optional({ values: 'null' }).isString().isLength({ max: 5000 }).withMessage('Message exceeds 5000 characters'),
  body('attachmentUrl').optional({ values: 'falsy' }).isURL(URL_OPTIONS).withMessage('Invalid attachment URL'),
  body('attachmentType').optional({ values: 'falsy' }).isIn(['image', 'file']).withMessage('Invalid attachment type'),
  body('attachmentName').optional({ values: 'falsy' }).isString().isLength({ max: 255 }),
  body('replyTo').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid reply message ID')
];

export const validateConversation = [
  body('type').isIn(['direct', 'group']).withMessage('Type must be "direct" or "group"'),
  body('participants').isArray({ min: 1 }).withMessage('Pick at least one person'),
  body('participants.*').isMongoId().withMessage('Invalid participant ID'),
  body('name').optional({ values: 'falsy' }).trim().isLength({ max: 50 }).withMessage('Group name must be 50 characters or less')
];

export const validateParticipant = [
  body('userId').isMongoId().withMessage('Invalid user ID')
];

/**
 * Sends the first validation problem as { message } — the same shape as every other error,
 * so the client can always show `error.response.data.message`.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array();
    return res.status(400).json({ message: list[0].msg, errors: list });
  }
  next();
};
