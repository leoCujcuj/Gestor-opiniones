import { User, UserProfile } from './user.model.js';
import { verifyPassword, hashPassword } from '../../utils/password-utils.js';

export const updateProfile = async (req, res) => {
    try {
        const { name, surname, username, phone } = req.body;
        const userId = req.user.Id;

        // 1. Actualizar datos en la tabla principal (Postgres)
        await User.update({
            Name: name,
            Surname: surname,
            Username: username?.toLowerCase()
        }, { where: { Id: userId } });

        // 2. Preparar actualización del perfil
        const profileUpdate = { Phone: phone };

        // Si el middleware subió una foto, Multer pone los datos en req.file
        if (req.file) {
            // Usamos path o secure_url dependiendo de la versión de la librería
            profileUpdate.ProfilePicture = req.file.path || req.file.secure_url;
        }

        await UserProfile.update(profileUpdate, { where: { UserId: userId } });

        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.Id);

        // Validar contraseña anterior (Requisito obligatorio) 
        const isMatch = await verifyPassword(user.Password, oldPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'La contraseña anterior no coincide' });
        }

        user.Password = await hashPassword(newPassword);
        await user.save();

        return res.status(200).json({ success: true, message: 'Contraseña actualizada' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};