import { Request, Response } from 'express';
import Appointment from '../models/Appointment.js';
import { startOfDay, endOfDay, addMinutes } from 'date-fns';

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { barberId, service, date, duration = 30, notes } = req.body;
    const clientId = req.user._id;

    // Check if the time slot is available
    const appointmentDate = new Date(date);
    const endTime = addMinutes(appointmentDate, duration);

    const existingAppointment = await Appointment.findOne({
      barber: barberId,
      date: {
        $gte: appointmentDate,
        $lt: endTime
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    const appointment = new Appointment({
      client: clientId,
      barber: barberId,
      service,
      date: appointmentDate,
      duration,
      notes,
      status: 'pending'
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error });
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
      start: 9, // 9 AM
      end: 18   // 6 PM
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
    const userId = req.user._id;
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
    if (appointment.client.toString() !== req.user._id.toString() && 
        appointment.barber.toString() !== req.user._id.toString()) {
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
    if (appointment.client.toString() !== req.user._id.toString() && 
        appointment.barber.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment', error });
  }
}; 