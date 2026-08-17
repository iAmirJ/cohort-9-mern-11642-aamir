const { body, param, query } = require('express-validator');

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const createNoteValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Title must be under 255 characters'),
  body('content')
    .optional()
    .custom(isPlainObject).withMessage('Content must be an object'),
];

const updateNoteValidator = [
  param('id').isUUID().withMessage('Invalid note id'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Title must be under 255 characters'),
  body('content')
    .optional()
    .custom(isPlainObject).withMessage('Content must be an object'),
  body().custom((value) => {
    if (value.title === undefined && value.content === undefined) {
      throw new Error('At least one of title or content is required');
    }
    return true;
  }),
];

const noteIdValidator = [
  param('id').isUUID().withMessage('Invalid note id'),
];

const listNotesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('search must be under 255 characters'),
];

module.exports = { createNoteValidator, updateNoteValidator, noteIdValidator, listNotesValidator };