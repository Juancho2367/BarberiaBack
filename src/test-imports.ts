// Archivo de prueba para verificar importaciones
// Este archivo se puede eliminar después de verificar que funciona

import { autoMaintenance } from './scripts/autoMaintenance.js';
import BarberAvailability from './models/BarberAvailability.js';
import Appointment from './models/Appointment.js';
import User from './models/User.js';

console.log('✅ Todas las importaciones funcionan correctamente');

// Exportar para evitar warnings de TypeScript
export { autoMaintenance, BarberAvailability, Appointment, User };
