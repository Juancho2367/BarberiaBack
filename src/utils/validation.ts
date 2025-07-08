import { Request, Response, NextFunction } from 'express';

// Validation schemas
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Validation middleware
export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'El nombre debe tener al menos 2 caracteres' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Email inválido' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ 
      message: 'La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número' 
    });
  }

  next();
};

export const validateAppointment = (req: Request, res: Response, next: NextFunction) => {
  const { date, time, service, barberId } = req.body;

  if (!validateDate(date)) {
    return res.status(400).json({ message: 'Fecha inválida' });
  }

  if (!validateTime(time)) {
    return res.status(400).json({ message: 'Hora inválida' });
  }

  if (!service || service.trim().length === 0) {
    return res.status(400).json({ message: 'El servicio es requerido' });
  }

  if (!barberId) {
    return res.status(400).json({ message: 'El barbero es requerido' });
  }

  // Check if appointment is in the future
  const appointmentDate = new Date(`${date}T${time}`);
  if (appointmentDate <= new Date()) {
    return res.status(400).json({ message: 'La cita debe ser en el futuro' });
  }

  next();
};

// Error handling utilities
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode = 500, message } = error;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'ID inválido';
  }

  if (error.code === 11000) {
    statusCode = 400;
    message = 'Datos duplicados';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}; 