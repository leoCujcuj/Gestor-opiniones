import { Router } from 'express';
import {
  updateComment,
  deleteComment,
  getMyComments,
} from './comment.controller.js';
import {
  updateCommentValidator,
  commentIdValidator,
} from './comment.validator.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { handleValidationErrors } from '../../middlewares/validation.js';

const router = Router();

/* ============================================================
   TODAS LAS RUTAS REQUIEREN JWT
   ============================================================ */

router.get('/my', validateJWT, getMyComments);

router.put(
  '/:id',
  validateJWT,
  updateCommentValidator,
  handleValidationErrors,
  updateComment
);

router.delete(
  '/:id',
  validateJWT,
  commentIdValidator,
  handleValidationErrors,
  deleteComment
);

export default router;
