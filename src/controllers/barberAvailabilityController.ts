import { Request, Response } from 'express';
import BarberAvailability from '../models/BarberAvailability.js';
import Appointment from '../models/Appointment.js';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

// Time slots from 8:00 to 19:00 (30-minute intervals)
const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

export const setBarberAvailability = async (req: Request, res: Response) => {
  try {
    const { date, timeSlots, action } = req.body; // action: 'remove' or 'add'
    const barberId = req.user._id;

    // Verificar que el usuario sea un barbero
    if (req.user.role !== 'barber') {
      return res.status(403).json({ message: 'Solo los barberos pueden configurar su disponibilidad' });
    }

    // Validar que la fecha no sea del pasado
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return res.status(400).json({ 
        message: 'No se puede configurar disponibilidad para días pasados' 
      });
    }

    // Buscar disponibilidad existente o crear una nueva
    let availability = await BarberAvailability.findOne({
      barber: barberId,
      date: selectedDate
    });

    if (!availability) {
      // Si no existe, crear con todos los slots disponibles
      availability = new BarberAvailability({
        barber: barberId,
        date: new Date(date),
        timeSlots: DEFAULT_TIME_SLOTS,
        isAvailable: true
      });
    }

    if (action === 'remove') {
      // Remover slots específicos
      availability.timeSlots = availability.timeSlots.filter(
        (slot: string) => !timeSlots.includes(slot)
      );
    } else if (action === 'add') {
      // Agregar slots específicos (sin duplicados)
      const existingSlots = new Set(availability.timeSlots);
      timeSlots.forEach((slot: string) => existingSlots.add(slot));
      availability.timeSlots = Array.from(existingSlots).sort();
    } else {
      // Reemplazar todos los slots
      availability.timeSlots = timeSlots;
    }

    availability.isAvailable = availability.timeSlots.length > 0;
    await availability.save();

    res.json({
      message: `Disponibilidad ${action === 'remove' ? 'removida' : action === 'add' ? 'agregada' : 'actualizada'} exitosamente`,
      availability
    });
  } catch (error) {
    console.error('Error en setBarberAvailability:', error);
    res.status(500).json({ message: 'Error al configurar disponibilidad', error });
  }
};

export const getBarberAvailability = async (req: Request, res: Response) => {
  try {
    const { barberId, startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : startOfWeek(new Date());
    const end = endDate ? new Date(endDate as string) : endOfWeek(new Date());

    const availability = await BarberAvailability.find({
      barber: barberId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json(availability);
  } catch (error) {
    console.error('Error en getBarberAvailability:', error);
    res.status(500).json({ message: 'Error al obtener disponibilidad', error });
  }
};

export const getAvailableSlotsForDate = async (req: Request, res: Response) => {
  try {
    const { barberId, date } = req.query;
    const selectedDate = new Date(date as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validar que la fecha no sea del pasado
    if (selectedDate < today) {
      return res.status(400).json({ 
        message: 'No se puede consultar disponibilidad para días pasados' 
      });
    }

    // Obtener disponibilidad del barbero para la fecha
    const availability = await BarberAvailability.findOne({
      barber: barberId,
      date: selectedDate
    });

    // Si no hay disponibilidad configurada, usar slots por defecto
    const availableSlots = availability?.timeSlots || DEFAULT_TIME_SLOTS;

    // Obtener citas existentes para la fecha
    const appointments = await Appointment.find({
      barber: barberId,
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      }
    });

    // Filtrar slots disponibles (excluir los que tienen citas)
    const reservedSlots = appointments.map(apt => apt.time);
    const freeSlots = availableSlots.filter(slot => !reservedSlots.includes(slot));

    res.json({
      availableSlots: freeSlots,
      reservedSlots,
      allSlots: availableSlots,
      isAvailable: freeSlots.length > 0
    });
  } catch (error) {
    console.error('Error en getAvailableSlotsForDate:', error);
    res.status(500).json({ message: 'Error al obtener slots disponibles', error });
  }
};

export const getWeeklyAvailability = async (req: Request, res: Response) => {
  try {
    const { barberId, startDate, endDate } = req.query;
    
    if (!barberId) {
      return res.status(400).json({ message: 'barberId es requerido' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate y endDate son requeridos' });
    }

    const weekStart = new Date(startDate as string);
    const weekEnd = new Date(endDate as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Asegurar que solo se procesen días actuales o futuros
    if (weekStart < today) {
      weekStart.setTime(today.getTime());
    }

    // Obtener disponibilidad configurada de la semana (solo días actuales/futuros)
    const availability = await BarberAvailability.find({
      barber: barberId,
      date: { $gte: weekStart, $lte: weekEnd }
    }).sort({ date: 1 });

    // Obtener citas de la semana (solo días actuales/futuros)
    const appointments = await Appointment.find({
      barber: barberId,
      date: { $gte: weekStart, $lte: weekEnd }
    });

    // Formatear respuesta para el frontend
    const weeklyData: { [key: string]: any } = {};
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      
      // Solo procesar días actuales o futuros
      if (currentDate < today) {
        continue;
      }
      
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      
      // Buscar disponibilidad configurada para este día
      const dayAvailability = availability.find(av => 
        av.date.toDateString() === currentDate.toDateString()
      );
      
      // Si no hay disponibilidad configurada, usar slots por defecto
      const availableSlots = dayAvailability?.timeSlots || DEFAULT_TIME_SLOTS;
      
      // Obtener citas para este día
      const dayAppointments = appointments.filter(apt => 
        apt.date.toDateString() === currentDate.toDateString()
      );
      
      // Filtrar slots disponibles (excluir los que tienen citas)
      const reservedSlots = dayAppointments.map(apt => apt.time);
      const freeSlots = availableSlots.filter(slot => !reservedSlots.includes(slot));
      
      weeklyData[dateKey] = {
        date: dateKey,
        availableSlots: freeSlots,
        reservedSlots,
        allSlots: availableSlots,
        isAvailable: freeSlots.length > 0
      };
    }

    res.json(weeklyData);
  } catch (error) {
    console.error('Error en getWeeklyAvailability:', error);
    res.status(500).json({ 
      message: 'Error al obtener disponibilidad semanal', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
