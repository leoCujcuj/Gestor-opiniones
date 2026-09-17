import { Router } from 'express';
import {
  createPublication,
  getPublications,
  getPublicationById,
  updatePublication,
  deletePublication,
  getMyPublications,
} from './publication.controller.js';
import {
  createPublicationValidator,
  updatePublicationValidator,
  mongoIdValidator,
} from './publication.validator.js';
import { createCommentValidator } from '../comments/comment.validator.js';
import { createComment, getCommentsByPublication } from '../comments/comment.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { handleValidationErrors } from '../../middlewares/validation.js';

const router = Router();

/* ============================================================
   RUTAS PÚBLICAS
   ============================================================ */

router.get('/', getPublications);

router.get(
  '/:id',
  mongoIdValidator,
  handleValidationErrors,
  getPublicationById
);

router.get(
  '/:publicationId/comments',
  handleValidationErrors,
  getCommentsByPublication
);

/* ============================================================
   RUTAS PROTEGIDAS
   ============================================================ */

router.get('/my', validateJWT, getMyPublications);

router.post(
  '/',
  validateJWT,
  createPublicationValidator,
  handleValidationErrors,
  createPublication
);

router.put(
  '/:id',
  validateJWT,
  updatePublicationValidator,
  handleValidationErrors,
  updatePublication
);

router.delete(
  '/:id',
  validateJWT,
  mongoIdValidator,
  handleValidationErrors,
  deletePublication
);

router.post(
  '/:publicationId/comments',
  validateJWT,
  createCommentValidator,
  handleValidationErrors,
  createComment
);

export default router;
