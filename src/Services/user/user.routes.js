import { Router } from 'express';
import { updateProfile, updatePassword } from './user.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { uploadFieldImage } from '../../middlewares/file-uploader.js'; // Tu nuevo uploader
import { cleanUploaderFileOnFinish, deleteFileOnError } from '../../middlewares/delete-file-on-error.js';

const router = Router();

// Ruta para editar perfil con foto
router.put(
    '/update-profile',
    [
        validateJWT,
        uploadFieldImage.single('profilePicture'),
        cleanUploaderFileOnFinish
    ],
    updateProfile,
    deleteFileOnError
);

router.put('/update-password', validateJWT, updatePassword);

export default router;