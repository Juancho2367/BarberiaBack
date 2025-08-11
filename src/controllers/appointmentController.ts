import { Request, Response } from 'express';
import Appointment from '../models/Appointment.js';
import { startOfDay, endOfDay, addMinutes } from 'date-fns';

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { clientId, barberId, service, date, time, duration = 30, notes } = req.body;
    
    console.log('=== CREATE APPOINTMENT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Client ID from body:', clientId);
    console.log('Client ID type:', typeof clientId);
    console.log('================================');

    // Validar que clientId esté presente
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID es requerido' });
    }
    
    // Verificar que el slot esté disponible según la disponibilidad del barbero
    const appointmentDate = new Date(date);
    const appointmentTime = time;

    // Verificar disponibilidad del barbero para esa fecha y hora
    const BarberAvailability = (await import('../models/BarberAvailability.js')).default;
    console.log('BarberAvailability model imported successfully');
    
    const barberAvailability = await BarberAvailability.findOne({
      barber: barberId,
      date: appointmentDate
    });
    console.log('Barber availability check result:', barberAvailability);

    // Si no hay registro de disponibilidad, todos los slots están disponibles por defecto
    // Si hay registro, verificar que el slot no esté en la lista de slots removidos
    if (barberAvailability && barberAvailability.timeSlots.includes(appointmentTime)) {
      return res.status(409).json({ message: 'Este horario no está disponible para el barbero.' });
    }

    // Verificar que no haya conflicto con otras citas
    const existingAppointment = await Appointment.findOne({
      barber: barberId,
      date: appointmentDate,
      time: appointmentTime,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(409).json({ message: 'Este horario ya está reservado.' });
    }

    console.log('About to create Appointment with:', {
      client: clientId,
      barber: barberId,
      service,
      date: appointmentDate,
      time: appointmentTime,
      duration,
      notes,
      status: 'pending'
    });
    
    const appointment = new Appointment({
      client: clientId,
      barber: barberId,
      service,
      date: appointmentDate,
      time: appointmentTime,
      duration,
      notes,
      status: 'pending'
    });
    
    console.log('Appointment object created successfully');
    console.log('Appointment client field:', appointment.client);
    console.log('Appointment barber field:', appointment.barber);

    await appointment.save();
    
    res.status(201).json({
      message: '¡Cita creada exitosamente!',
      appointment: appointment,
      redirectTo: '/profile'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    console.error('Request body:', req.body);
    console.error('User:', req.user);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Error creating appointment', error: errorMessage });
  }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { barberId, date } = req.query;
    const selectedDate = new Date(date as string);
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    // Get all appointments for the barber on the selected date
    const appointments = await Appointment.find({
      barber: barberId,
      date: { $gte: start, $lte: end }
    });

    // Generate available time slots (assuming 30-minute intervals)
    const availableSlots = [];
    const workingHours = {
      start: 8, // 8 AM
      end: 19   // 7 PM
    };

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);

        const isSlotAvailable = !appointments.some(appointment => {
          const appointmentEnd = addMinutes(appointment.date, appointment.duration);
          return slotTime >= appointment.date && slotTime < appointmentEnd;
        });

        if (isSlotAvailable) {
          availableSlots.push(slotTime);
        }
      }
    }

    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: 'Error getting available slots', error });
  }
};

export const getUserAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.find({
      $or: [{ client: userId }, { barber: userId }]
    })
    .populate('client', 'name email')
    .populate('barber', 'name email')
    .sort({ date: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error getting appointments', error });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is authorized to update
    if (appointment.client.toString() !== req.user.id.toString() && 
        appointment.barber.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    Object.assign(appointment, req.body);
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is authorized to cancel
    if (appointment.client.toString() !== req.user.id.toString() && 
        appointment.barber.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment', error });
  }
}; 