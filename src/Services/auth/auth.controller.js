import { sequelize } from '../../configs/db-postgresql.js';
import { User, UserProfile, UserEmail } from '../user/user.model.js';
import { Role, UserRole } from '../auth/role.model.js';
import { USUARIO, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { sendVerificationEmail, sendRoleRequestEmail, sendRoleUpgradeResponseEmail } from '../../helpers/email-service.js';
import { generateJWT, generateVerificationToken } from '../../helpers/generate-jwt.js';
import { hashPassword, verifyPassword } from '../../utils/password-utils.js';
import { findUserByEmailOrUsername } from '../../helpers/user-db.js';
import { RoleUpgradeRequest } from './RoleUpgradeRequest.js';

/* =========================
   REGISTER
   ========================= */
export const register = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, surname, username, email, password, phone } = req.body;
        const hashedPassword = await hashPassword(password);

        const user = await User.create({
            Name: name,
            Surname: surname,
            Username: username.toLowerCase(),
            Email: email.toLowerCase(),
            Password: hashedPassword,
            Status: false
        }, { transaction: t });

        await UserProfile.create({
            UserId: user.Id,
            Phone: phone
        }, { transaction: t });

        const role = await Role.findOne({ where: { Name: USUARIO } });

        if (!role) {
            throw new Error(`El rol ${USUARIO} no existe.`);
        }

        await UserRole.create({
            UserId: user.Id,
            RoleId: role.Id
        }, { transaction: t });

        const verificationToken = await generateVerificationToken(user.Id, 'EMAIL_VERIFICATION');
        await UserEmail.create({
            UserId: user.Id,
            EmailVerificationToken: verificationToken,
            EmailVerificationTokenExpiry: new Date(Date.now() + (24 * 60 * 60 * 1000))
        }, { transaction: t });

        await t.commit();

        try {
            await sendVerificationEmail(user.Email, user.Name, verificationToken);
            console.log(`Correo enviado a: ${user.Email}`);
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
        }

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado. Por favor verifica tu correo para activar tu cuenta.',
            user: { username: user.Username, email: user.Email }
        });
    } catch (error) {
        if (t) await t.rollback();
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   LOGIN
   ========================= */
export const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        const user = await findUserByEmailOrUsername(emailOrUsername);

        if (!user) return res.status(404).json({ success: false, message: 'Credenciales inválidas.' });

        if (!user.Status) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta desactivada o correo no verificado.'
            });
        }

        const isMatch = await verifyPassword(user.Password, password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });

        const roles = user.UserRoles.map(ur => ur.Role.Name);
        const token = await generateJWT(user.Id, { roles });

        return res.status(200).json({
            success: true,
            message: `Bienvenido, ${user.Name}`,
            token,
            user: { id: user.Id, username: user.Username, roles }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno.', error: error.message });
    }
};

/* =========================
   EMAIL VERIFICATION
   ========================= */
export const verifyEmail = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { token } = req.body;
        const record = await UserEmail.findOne({ where: { EmailVerificationToken: token }, transaction: t });

        if (!record || new Date() > record.EmailVerificationTokenExpiry) {
            return res.status(400).json({ success: false, message: "Token inválido o expirado." });
        }

        record.EmailVerified = true;
        record.EmailVerificationToken = null;
        record.EmailVerificationTokenExpiry = null;
        await record.save({ transaction: t });

        await User.update({ Status: true }, { where: { Id: record.UserId }, transaction: t });

        await t.commit();
        return res.status(200).json({ success: true, message: "Correo verificado y cuenta activada." });
    } catch (error) {
        if (t) await t.rollback();
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
    ROLE UPGRADE REQUESTS
    ========================= */
export const requestRoleUpgrade = async (req, res) => {
    try {
        const { requestedRole } = req.body;

        // 1. Obtener el rol actual del usuario desde la asociación
        // Asumiendo que usas el middleware validateJWT que llena req.user
        const currentRoleName = req.user.UserRoles && req.user.UserRoles.length > 0
            ? req.user.UserRoles[0].Role.Name
            : 'Sin Rol';

        if (currentRoleName === requestedRole) {
            return res.status(400).json({ success: false, message: 'Ya tienes este rol asignado' });
        }

        // 2. Verificar si ya hay una solicitud pendiente
        const existingRequest = await RoleUpgradeRequest.findOne({
            where: { UserId: req.user.Id, Status: 'PENDING' }
        });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Ya tienes una solicitud pendiente' });
        }

        // 3. Crear la solicitud en la DB
        const request = await RoleUpgradeRequest.create({
            UserId: req.user.Id,
            RequestedRole: requestedRole,
            Status: 'PENDING'
        });

        // 4. Buscar los datos del Admin para enviarle el correo
        const adminRoot = await User.findOne({ where: { Email: process.env.ROOT_ADMIN_EMAIL } });

        if (adminRoot) {
            // NOTA: No usamos 'await' aquí para no bloquear la respuesta al usuario, 
            // pero manejamos el error con .catch
            sendRoleRequestEmail({
                adminEmail: adminRoot.Email,
                userName: `${req.user.Name} ${req.user.Surname}`,
                userEmail: req.user.Email,
                currentRole: currentRoleName,
                requestedRole: requestedRole,
                requestId: request.Id
            }).catch(err => console.error('Error enviando email al admin:', err));
        }

        return res.status(201).json({
            success: true,
            message: 'Solicitud enviada al administrador correctamente.',
            data: request
        });
    } catch (error) {
        console.error('Error en requestRoleUpgrade:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/* =========================
    HANDLE ROLE REQUEST (ADMIN ACTION)
    ========================= */
export const handleRoleRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { token } = req.query;

        // 1. Validar Token de seguridad del Admin
        if (token !== process.env.ROOT_ADMIN_TOKEN) {
            return res.status(403).send('<h1 style="color:red; text-align:center;">Acceso Denegado: Token Inválido</h1>');
        }

        // 2. Buscar la solicitud
        const request = await RoleUpgradeRequest.findByPk(id);
        if (!request || request.Status !== 'PENDING') {
            return res.status(404).send('<h1 style="text-align:center;">Solicitud no encontrada o ya procesada</h1>');
        }

        const isApproval = req.path.includes('approve');
        const action = isApproval ? 'APPROVED' : 'REJECTED';

        // 3. Buscar al Admin Root para registrar quién revisó
        const rootAdmin = await User.findOne({ where: { Email: process.env.ROOT_ADMIN_EMAIL } });

        // 4. Actualizar estado de la solicitud
        request.Status = action;
        request.ReviewedBy = rootAdmin ? rootAdmin.Id : null;
        await request.save();

        // 5. Si se aprueba, cambiar el rol en la base de datos
        if (isApproval) {
            const role = await Role.findOne({ where: { Name: request.RequestedRole } });
            if (role) {
                // Eliminamos roles anteriores y asignamos el nuevo
                await UserRole.destroy({ where: { UserId: request.UserId } });
                await UserRole.create({ UserId: request.UserId, RoleId: role.Id });
            }
        }

        // 6. NOTIFICAR AL USUARIO DEL RESULTADO
        const requestingUser = await User.findByPk(request.UserId);
        if (requestingUser) {
            sendRoleUpgradeResponseEmail({
                userEmail: requestingUser.Email,
                userName: requestingUser.Name,
                requestedRole: request.RequestedRole,
                status: action
            }).catch(err => console.error('Error enviando respuesta al usuario:', err));
        }

        return res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; border: 1px solid #ddd; padding: 20px; border-radius: 10px; display: inline-block;">
                <h1 style="color: ${isApproval ? '#2e7d32' : '#c62828'};">Solicitud ${isApproval ? 'Aprobada' : 'Rechazada'}</h1>
                <p>Se ha enviado una notificación por correo a <b>${requestingUser ? requestingUser.Email : 'el usuario'}</b>.</p>
                <p>Puedes cerrar esta ventana.</p>
            </div>
        `);

    } catch (error) {
        console.error('Error en handleRoleRequest:', error);
        return res.status(500).send(`Error crítico: ${error.message}`);
    }
};