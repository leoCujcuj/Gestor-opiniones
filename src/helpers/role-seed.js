import { Role } from '../Services/auth/role.model.js';
import { ADMIN_SISTEMA, USUARIO } from './role-constants.js';

export const seedRoles = async () => {
    try {
        const rolesToSeed = [ADMIN_SISTEMA, USUARIO];
        
        for (const name of rolesToSeed) {
            await Role.findOrCreate({
                where: { Name: name },
                defaults: { Name: name },
            });
        }
        console.log('PostgreSQL | Roles verificados/creados');
    } catch (error) {
        console.error('Error al crear roles:', error.message);
    }
};