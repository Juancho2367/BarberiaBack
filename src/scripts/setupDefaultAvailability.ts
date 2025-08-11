import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BarberAvailability from '../models/BarberAvailability.js';
import User from '../models/User.js';
import { addDays, startOfWeek, format } from 'date-fns';

// Load environment variables
dotenv.config();

// Time slots from 8:00 to 19:00 (30-minute intervals)
const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barberia');
    console.log(`✅ Conectado a MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Generate dates for the next 4 weeks (Monday to Friday only)
const generateWorkDays = (weeks: number = 4) => {
  const dates: Date[] = [];
  const today = new Date();
  let currentDate = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
  
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 5; day++) { // Monday to Friday
      const workDay = addDays(currentDate, day);
      dates.push(workDay);
    }
    currentDate = addDays(currentDate, 7); // Move to next week
  }
  
  return dates;
};

// Set up default availability for a barber
const setupBarberAvailability = async (barberId: string, dates: Date[]) => {
  console.log(`🔄 Configurando disponibilidad para barbero: ${barberId}`);
  
  const availabilityData = dates.map(date => ({
    barber: barberId,
    date: date,
    timeSlots: DEFAULT_TIME_SLOTS,
    isAvailable: true
  }));
  
  try {
    // Remove existing availability for this barber
    await BarberAvailability.deleteMany({ barber: barberId });
    console.log(`🗑️  Disponibilidad anterior eliminada para barbero: ${barberId}`);
    
    // Insert new default availability
    const result = await BarberAvailability.insertMany(availabilityData);
    console.log(`✅ ${result.length} días de disponibilidad configurados para barbero: ${barberId}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error configurando disponibilidad para barbero ${barberId}:`, error);
    throw error;
  }
};

// Main function to set up default availability for all barbers
const setupDefaultAvailability = async () => {
  try {
    await connectDB();
    
    // Get all barbers
    const barbers = await User.find({ role: 'barber' });
    console.log(`👥 Encontrados ${barbers.length} barberos`);
    
    if (barbers.length === 0) {
      console.log('⚠️  No hay barberos registrados. Creando usuario de prueba...');
      
      // Create a test barber if none exist
      const testBarber = new User({
        name: 'Barbero Test',
        email: 'barbero@test.com',
        password: 'password123',
        role: 'barber',
        phone: '123456789'
      });
      
      await testBarber.save();
      console.log('✅ Usuario barbero de prueba creado');
      barbers.push(testBarber);
    }
    
    // Generate work days for the next 4 weeks
    const workDays = generateWorkDays(4);
    console.log(`📅 Configurando disponibilidad para ${workDays.length} días laborables`);
    
    // Set up availability for each barber
    for (const barber of barbers) {
      await setupBarberAvailability(barber._id, workDays);
    }
    
    console.log('🎉 Configuración de disponibilidad por defecto completada');
    console.log(`📊 Resumen:`);
    console.log(`   - Barberos configurados: ${barbers.length}`);
    console.log(`   - Días configurados: ${workDays.length}`);
    console.log(`   - Horarios por día: ${DEFAULT_TIME_SLOTS.length} slots`);
    console.log(`   - Total de slots: ${barbers.length * workDays.length * DEFAULT_TIME_SLOTS.length}`);
    
    // Show sample availability
    const sampleAvailability = await BarberAvailability.findOne().populate('barber', 'name');
    if (sampleAvailability) {
      console.log(`\n📋 Ejemplo de disponibilidad configurada:`);
      console.log(`   Barbero: ${sampleAvailability.barber.name}`);
      console.log(`   Fecha: ${format(sampleAvailability.date, 'dd/MM/yyyy')}`);
      console.log(`   Slots disponibles: ${sampleAvailability.timeSlots.length}`);
      console.log(`   Primer slot: ${sampleAvailability.timeSlots[0]}`);
      console.log(`   Último slot: ${sampleAvailability.timeSlots[sampleAvailability.timeSlots.length - 1]}`);
    }
    
  } catch (error) {
    console.error('❌ Error en setup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Run the script
setupDefaultAvailability();
