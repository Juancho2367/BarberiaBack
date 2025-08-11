import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BarberAvailability from '../models/BarberAvailability.js';
import User from '../models/User.js';
import { format, parseISO } from 'date-fns';

// Load environment variables
dotenv.config();

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

// Remove specific time slots from a barber's availability
const removeTimeSlots = async (barberId: string, date: string, timeSlotsToRemove: string[]) => {
  try {
    const availability = await BarberAvailability.findOne({
      barber: barberId,
      date: parseISO(date)
    });
    
    if (!availability) {
      console.log(`❌ No se encontró disponibilidad para el barbero ${barberId} en la fecha ${date}`);
      return null;
    }
    
    // Remove the specified time slots
    const updatedTimeSlots = availability.timeSlots.filter(
      (slot: string) => !timeSlotsToRemove.includes(slot)
    );
    
    availability.timeSlots = updatedTimeSlots;
    availability.isAvailable = updatedTimeSlots.length > 0;
    
    await availability.save();
    
    console.log(`✅ Slots removidos para barbero ${barberId} en ${date}:`);
    console.log(`   Slots removidos: ${timeSlotsToRemove.join(', ')}`);
    console.log(`   Slots restantes: ${updatedTimeSlots.length}`);
    
    return availability;
  } catch (error) {
    console.error(`❌ Error removiendo slots para barbero ${barberId}:`, error);
    throw error;
  }
};

// Add specific time slots back to a barber's availability
const addTimeSlots = async (barberId: string, date: string, timeSlotsToAdd: string[]) => {
  try {
    let availability = await BarberAvailability.findOne({
      barber: barberId,
      date: parseISO(date)
    });
    
    if (!availability) {
      console.log(`⚠️  No se encontró disponibilidad para el barbero ${barberId} en la fecha ${date}`);
      console.log(`🔄 Creando nueva entrada de disponibilidad...`);
      
      availability = new BarberAvailability({
        barber: barberId,
        date: parseISO(date),
        timeSlots: timeSlotsToAdd,
        isAvailable: true
      });
    } else {
      // Add new time slots without duplicates
      const existingSlots = new Set(availability.timeSlots);
      timeSlotsToAdd.forEach((slot: string) => existingSlots.add(slot));
      availability.timeSlots = Array.from(existingSlots).sort();
      availability.isAvailable = true;
    }
    
    await availability.save();
    
    console.log(`✅ Slots agregados para barbero ${barberId} en ${date}:`);
    console.log(`   Slots agregados: ${timeSlotsToAdd.join(', ')}`);
    console.log(`   Total de slots: ${availability.timeSlots.length}`);
    
    return availability;
  } catch (error) {
    console.error(`❌ Error agregando slots para barbero ${barberId}:`, error);
    throw error;
  }
};

// Show current availability for a barber
const showAvailability = async (barberId: string, startDate?: string, endDate?: string) => {
  try {
    const query: any = { barber: barberId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      };
    }
    
    const availability = await BarberAvailability.find(query)
      .sort({ date: 1 });
    
    if (availability.length === 0) {
      console.log(`❌ No se encontró disponibilidad para el barbero ${barberId}`);
      return;
    }
    
    console.log(`📋 Disponibilidad actual para barbero: ${barberId}`);
    console.log(`📅 Total de días: ${availability.length}`);
    
    availability.forEach(day => {
      console.log(`\n   ${format(day.date, 'dd/MM/yyyy (EEEE)')}:`);
      console.log(`     Slots disponibles: ${day.timeSlots.length}`);
      console.log(`     Horarios: ${day.timeSlots.join(', ')}`);
      console.log(`     Disponible: ${day.isAvailable ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error(`❌ Error mostrando disponibilidad para barbero ${barberId}:`, error);
  }
};

// Main function to manage barber availability
const manageBarberAvailability = async () => {
  try {
    await connectDB();
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command) {
      console.log('📖 Uso del script:');
      console.log('   npm run manage-availability -- show <barberId> [startDate] [endDate]');
      console.log('   npm run manage-availability -- remove <barberId> <date> <timeSlots>');
      console.log('   npm run manage-availability -- add <barberId> <date> <timeSlots>');
      console.log('');
      console.log('📝 Ejemplos:');
      console.log('   npm run manage-availability -- show 686c26869222f6ccab0674ae');
      console.log('   npm run manage-availability -- remove 686c26869222f6ccab0674ae 2025-08-12 "09:00,10:00"');
      console.log('   npm run manage-availability -- add 686c26869222f6ccab0674ae 2025-08-12 "20:00,20:30"');
      return;
    }
    
    switch (command) {
      case 'show':
        const barberId = args[1];
        const startDate = args[2];
        const endDate = args[3];
        
        if (!barberId) {
          console.log('❌ Debe especificar un ID de barbero');
          return;
        }
        
        await showAvailability(barberId, startDate, endDate);
        break;
        
      case 'remove':
        const removeBarberId = args[1];
        const removeDate = args[2];
        const timeSlotsToRemove = args[3]?.split(',').map((s: string) => s.trim()) || [];
        
        if (!removeBarberId || !removeDate || timeSlotsToRemove.length === 0) {
          console.log('❌ Debe especificar barbero, fecha y slots a remover');
          return;
        }
        
        await removeTimeSlots(removeBarberId, removeDate, timeSlotsToRemove);
        break;
        
      case 'add':
        const addBarberId = args[1];
        const addDate = args[2];
        const timeSlotsToAdd = args[3]?.split(',').map((s: string) => s.trim()) || [];
        
        if (!addBarberId || !addDate || timeSlotsToAdd.length === 0) {
          console.log('❌ Debe especificar barbero, fecha y slots a agregar');
          return;
        }
        
        await addTimeSlots(addBarberId, addDate, timeSlotsToAdd);
        break;
        
      default:
        console.log(`❌ Comando desconocido: ${command}`);
        break;
    }
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Run the script
manageBarberAvailability();
