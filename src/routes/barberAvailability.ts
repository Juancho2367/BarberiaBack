import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  setBarberAvailability,
  getBarberAvailability,
  getAvailableSlotsForDate,
  getWeeklyAvailability
} from '../controllers/barberAvailabilityController.js';

const router = express.Router();

// RUTA PÚBLICA - Obtener disponibilidad semanal (no requiere autenticación)
router.get('/weekly-availability', getWeeklyAvailability);

// Rutas protegidas que requieren autenticación
router.use(auth);

// Configurar disponibilidad del barbero
router.post('/set-availability', setBarberAvailability);

// Obtener disponibilidad del barbero
router.get('/availability', getBarberAvailability);

// Obtener slots disponibles para una fecha específica
router.get('/available-slots', getAvailableSlotsForDate);

export default router;
