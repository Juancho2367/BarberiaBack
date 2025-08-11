import mongoose from 'mongoose';
import BarberAvailability from '../models/BarberAvailability';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barberia';

async function cleanupPastAvailability() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual

    console.log(`🗓️  Fecha actual: ${today.toISOString().split('T')[0]}`);

    // Buscar y eliminar registros de días pasados
    const pastRecords = await BarberAvailability.find({
      date: { $lt: today }
    });

    if (pastRecords.length === 0) {
      console.log('✅ No hay registros de días pasados para eliminar');
    } else {
      console.log(`🗑️  Encontrados ${pastRecords.length} registros de días pasados:`);
      
      for (const record of pastRecords) {
        console.log(`   - ${record.barberId}: ${record.date.toISOString().split('T')[0]} (${record.timeSlots.length} slots)`);
      }

      const deleteResult = await BarberAvailability.deleteMany({
        date: { $lt: today }
      });

      console.log(`✅ Eliminados ${deleteResult.deletedCount} registros de días pasados`);
    }

    // Verificar que solo quedan registros de días actuales o futuros
    const remainingRecords = await BarberAvailability.find().sort({ date: 1 });
    
    if (remainingRecords.length === 0) {
      console.log('ℹ️  No hay registros de disponibilidad en la base de datos');
    } else {
      console.log(`📊 Registros restantes (${remainingRecords.length}):`);
      
      for (const record of remainingRecords) {
        const dateStr = record.date.toISOString().split('T')[0];
        const isToday = record.date.toDateString() === today.toDateString();
        const isFuture = record.date > today;
        const status = isToday ? 'HOY' : isFuture ? 'FUTURO' : 'PASADO';
        
        console.log(`   - ${record.barberId}: ${dateStr} (${record.timeSlots.length} slots) - ${status}`);
      }
    }

    console.log('✅ Limpieza completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
cleanupPastAvailability();
