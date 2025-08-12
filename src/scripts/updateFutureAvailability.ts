import mongoose from 'mongoose';
import BarberAvailability from '../models/BarberAvailability.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barberia';

// Horarios por defecto (8:00 a 19:00)
const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

async function updateFutureAvailability() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual

    console.log(`🗓️  Fecha actual: ${today.toISOString().split('T')[0]}`);

    // Obtener todos los barberos
    const barbers = await User.find({ role: 'barber' });
    
    if (barbers.length === 0) {
      console.log('❌ No se encontraron barberos en el sistema');
      return;
    }

    console.log(`👨‍💼 Encontrados ${barbers.length} barberos:`);
    barbers.forEach(barber => {
      console.log(`   - ${barber._id}: ${barber.name} (${barber.email})`);
    });

    // Limpiar registros de días pasados
    console.log('\n🗑️  Limpiando registros de días pasados...');
    const deleteResult = await BarberAvailability.deleteMany({
      date: { $lt: today }
    });
    console.log(`✅ Eliminados ${deleteResult.deletedCount} registros de días pasados`);

    // Generar fechas para las próximas 4 semanas (solo días laborales)
    const workDays = [];
    const currentDate = new Date(today);
    
    // Avanzar al próximo lunes si hoy no es lunes
    const currentDay = currentDate.getDay();
    if (currentDay !== 1) { // 1 = Lunes
      const daysUntilMonday = currentDay === 0 ? 1 : 8 - currentDay;
      currentDate.setDate(currentDate.getDate() + daysUntilMonday);
    }

    // Generar 20 días laborales (4 semanas)
    for (let i = 0; i < 20; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      
      // Solo incluir días laborales (Lunes a Viernes)
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        workDays.push(new Date(date));
      }
    }

    console.log(`📅 Generando disponibilidad para ${workDays.length} días laborales:`);
    workDays.forEach(date => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
      console.log(`   - ${dayName} ${date.toISOString().split('T')[0]}`);
    });

    // Crear o actualizar disponibilidad para cada barbero
    for (const barber of barbers) {
      console.log(`\n👨‍💼 Configurando disponibilidad para ${barber.name}...`);
      
      for (const date of workDays) {
        // Verificar si ya existe un registro para esta fecha y barbero
        let availability = await BarberAvailability.findOne({
          barber: barber._id,
          date: date
        });

        if (availability) {
          // Actualizar slots existentes, manteniendo solo los que están en DEFAULT_TIME_SLOTS
          const updatedTimeSlots = availability.timeSlots.filter(slot => 
            DEFAULT_TIME_SLOTS.includes(slot)
          );
          
          if (updatedTimeSlots.length !== availability.timeSlots.length) {
            availability.timeSlots = updatedTimeSlots;
            await availability.save();
            console.log(`   ✅ Actualizado ${date.toISOString().split('T')[0]}: ${updatedTimeSlots.length} slots`);
          } else {
            console.log(`   ℹ️  ${date.toISOString().split('T')[0]}: ya configurado correctamente`);
          }
        } else {
          // Crear nuevo registro con todos los slots disponibles
          availability = new BarberAvailability({
            barber: barber._id,
            date: date,
            timeSlots: DEFAULT_TIME_SLOTS
          });
          
          await availability.save();
          console.log(`   ➕ Creado ${date.toISOString().split('T')[0]}: ${DEFAULT_TIME_SLOTS.length} slots`);
        }
      }
    }

    // Verificar el estado final
    console.log('\n📊 Estado final de la base de datos:');
    const allRecords = await BarberAvailability.find().sort({ date: 1 });
    
    if (allRecords.length === 0) {
      console.log('ℹ️  No hay registros de disponibilidad');
    } else {
      console.log(`📋 Total de registros: ${allRecords.length}`);
      
      // Agrupar por barbero
      const recordsByBarber = {};
      allRecords.forEach(record => {
        if (!recordsByBarber[record.barber.toString()]) {
          recordsByBarber[record.barber.toString()] = [];
        }
        recordsByBarber[record.barber.toString()].push(record);
      });

      Object.entries(recordsByBarber).forEach(([barberId, records]) => {
        const barber = barbers.find(b => b._id.toString() === barberId);
        const barberName = barber ? barber.name : 'Barbero desconocido';
        
        console.log(`\n👨‍💼 ${barberName} (${barberId}):`);
        records.forEach(record => {
          const dateStr = record.date.toISOString().split('T')[0];
          const isToday = record.date.toDateString() === today.toDateString();
          const isFuture = record.date > today;
          const status = isToday ? 'HOY' : isFuture ? 'FUTURO' : 'PASADO';
          
          console.log(`   - ${dateStr}: ${record.timeSlots.length} slots - ${status}`);
        });
      });
    }

    console.log('\n✅ Actualización de disponibilidad futura completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
updateFutureAvailability();
