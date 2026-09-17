import { body, param } from 'express-validator';
import { CATEGORIES } from './publication.model.js';

export const createPublicationValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('El título es requerido')
    .isLength({ min: 3, max: 150 }).withMessage('El título debe tener entre 3 y 150 caracteres'),

  body('category')
    .trim()
    .notEmpty().withMessage('La categoría es requerida')
    .isIn(CATEGORIES).withMessage(`Categoría inválida. Opciones: ${CATEGORIES.join(', ')}`),

  body('content')
    .trim()
    .notEmpty().withMessage('El contenido es requerido')
    .isLength({ min: 10, max: 5000 }).withMessage('El contenido debe tener entre 10 y 5000 caracteres'),
];

export const updatePublicationValidator = [
  param('id')
    .isMongoId().withMessage('ID de publicación inválido'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('El título debe tener entre 3 y 150 caracteres'),

  body('category')
    .optional()
    .trim()
    .isIn(CATEGORIES).withMessage(`Categoría inválida. Opciones: ${CATEGORIES.join(', ')}`),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('El contenido debe tener entre 10 y 5000 caracteres'),
];

export const mongoIdValidator = [
  param('id')
    .isMongoId().withMessage('ID inválido'),
];
