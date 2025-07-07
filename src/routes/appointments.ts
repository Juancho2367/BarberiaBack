import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import {
  createAppointment,
  getAvailableSlots,
  getUserAppointments,
  updateAppointment,
  cancelAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

// Get available time slots for a barber on a specific date
router.get('/available-slots', auth, getAvailableSlots);

// Get user's appointments (both as client and barber)
router.get('/my-appointments', auth, getUserAppointments);

// Create new appointment (clients only)
router.post('/', auth, checkRole(['client']), createAppointment);

// Update appointment (both client and barber)
router.patch('/:id', auth, updateAppointment);

// Cancel appointment (both client and barber)
router.delete('/:id', auth, cancelAppointment);

export default router; 