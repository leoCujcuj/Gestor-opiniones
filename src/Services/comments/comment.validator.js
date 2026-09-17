import { body, param } from 'express-validator';

export const createCommentValidator = [
  param('publicationId')
    .isMongoId().withMessage('ID de publicación inválido'),

  body('content')
    .trim()
    .notEmpty().withMessage('El comentario no puede estar vacío')
    .isLength({ min: 1, max: 1000 }).withMessage('El comentario debe tener entre 1 y 1000 caracteres'),
];

export const updateCommentValidator = [
  param('id')
    .isMongoId().withMessage('ID de comentario inválido'),

  body('content')
    .trim()
    .notEmpty().withMessage('El comentario no puede estar vacío')
    .isLength({ min: 1, max: 1000 }).withMessage('El comentario debe tener entre 1 y 1000 caracteres'),
];

export const commentIdValidator = [
  param('id')
    .isMongoId().withMessage('ID de comentario inválido'),
];
