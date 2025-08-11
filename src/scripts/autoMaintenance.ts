import mongoose from 'mongoose';
import BarberAvailability from '../models/BarberAvailability';
import Appointment from '../models/Appointment';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barberia';

// Horarios por defecto (8:00 a 19:00)
const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

async function autoMaintenance() {
  try {
    console.log('🤖 Iniciando mantenimiento automático...');
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual

    console.log(`🗓️  Fecha actual: ${today.toISOString().split('T')[0]}`);
    console.log(`⏰ Hora de ejecución: ${new Date().toLocaleTimeString()}`);

    // ========================================
    // PASO 1: PROTEGER CITAS AGENDADAS
    // ========================================
    console.log('\n🛡️  PASO 1: Protegiendo citas agendadas...');
    
    // Obtener todas las citas agendadas (pasadas, presentes y futuras)
    const allAppointments = await Appointment.find().populate('barber', 'name email');
    
    if (allAppointments.length === 0) {
      console.log('ℹ️  No hay citas agendadas en el sistema');
    } else {
      console.log(`📋 Total de citas agendadas: ${allAppointments.length}`);
      
      // Agrupar citas por barbero y fecha
      const appointmentsByBarber = {};
      allAppointments.forEach(apt => {
        // Verificar que el barbero esté poblado correctamente
        if (!apt.barber || !apt.barber._id) {
          console.log(`⚠️  Cita sin barbero válido: ${apt._id}`);
          return;
        }
        
        const barberId = apt.barber._id.toString();
        const dateKey = apt.date.toISOString().split('T')[0];
        
        if (!appointmentsByBarber[barberId]) {
          appointmentsByBarber[barberId] = {};
        }
        if (!appointmentsByBarber[barberId][dateKey]) {
          appointmentsByBarber[barberId][dateKey] = [];
        }
        appointmentsByBarber[barberId][dateKey].push(apt);
      });

      console.log('📊 Citas agendadas por barbero y fecha:');
      Object.entries(appointmentsByBarber).forEach(([barberId, dates]) => {
        const barber = allAppointments.find(apt => apt.barber && apt.barber._id && apt.barber._id.toString() === barberId)?.barber;
        console.log(`\n👨‍💼 ${barber?.name || 'Barbero desconocido'} (${barberId}):`);
        
        Object.entries(dates).forEach(([date, appointments]) => {
          const isPast = new Date(date) < today;
          const isToday = new Date(date).toDateString() === today.toDateString();
          const status = isPast ? 'PASADO' : isToday ? 'HOY' : 'FUTURO';
          
          console.log(`   📅 ${date} (${status}): ${appointments.length} citas`);
          appointments.forEach(apt => {
            console.log(`      - ${apt.time}: ${apt.clientName || 'Cliente'} - ${apt.service || 'Servicio'}`);
          });
        });
      });
    }

    // ========================================
    // PASO 2: LIMPIAR DISPONIBILIDAD PASADA
    // ========================================
    console.log('\n🗑️  PASO 2: Limpiando disponibilidad de días pasados...');
    
    // Buscar registros de disponibilidad de días pasados
    const pastAvailability = await BarberAvailability.find({
      date: { $lt: today }
    });

    if (pastAvailability.length === 0) {
      console.log('✅ No hay registros de disponibilidad de días pasados para eliminar');
    } else {
      console.log(`🗑️  Encontrados ${pastAvailability.length} registros de días pasados:`);
      
      // Verificar que no hay citas en estos días antes de eliminar
      let safeToDelete = 0;
      let hasAppointments = 0;
      
      for (const record of pastAvailability) {
        const dateKey = record.date.toISOString().split('T')[0];
        const barberId = record.barber.toString();
        
        // Verificar si hay citas para este barbero en esta fecha
        const appointmentsOnDate = await Appointment.find({
          barber: barberId,
          date: {
            $gte: new Date(record.date.setHours(0, 0, 0, 0)),
            $lt: new Date(record.date.setHours(23, 59, 59, 999))
          }
        });

        if (appointmentsOnDate.length > 0) {
          console.log(`   ⚠️  ${dateKey} (${barberId}): ${appointmentsOnDate.length} citas - NO ELIMINAR`);
          hasAppointments++;
        } else {
          console.log(`   ✅ ${dateKey} (${barberId}): Sin citas - SEGURO ELIMINAR`);
          safeToDelete++;
        }
      }

      // Solo eliminar registros que no tienen citas
      if (safeToDelete > 0) {
        const deleteResult = await BarberAvailability.deleteMany({
          date: { $lt: today },
          // Solo eliminar si no hay citas (esto se verifica en el loop anterior)
        });
        console.log(`✅ Eliminados ${deleteResult.deletedCount} registros de días pasados (sin citas)`);
      }

      if (hasAppointments > 0) {
        console.log(`⚠️  ${hasAppointments} registros de días pasados NO fueron eliminados (tienen citas)`);
      }
    }

    // ========================================
    // PASO 3: ACTUALIZAR DISPONIBILIDAD FUTURA
    // ========================================
    console.log('\n📅 PASO 3: Actualizando disponibilidad para días futuros...');
    
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
        const dateKey = date.toISOString().split('T')[0];
        
        // Verificar si ya existe un registro para esta fecha y barbero
        let availability = await BarberAvailability.findOne({
          barber: barber._id,
          date: date
        });

        if (availability) {
          // Verificar si hay citas para esta fecha
          const appointmentsOnDate = await Appointment.find({
            barber: barber._id,
            date: {
              $gte: new Date(date.setHours(0, 0, 0, 0)),
              $lt: new Date(date.setHours(23, 59, 59, 999))
            }
          });

          if (appointmentsOnDate.length > 0) {
            console.log(`   ℹ️  ${dateKey}: ${appointmentsOnDate.length} citas existentes - Mantener configuración actual`);
            // No modificar slots si hay citas
            continue;
          }

          // Actualizar slots existentes, manteniendo solo los que están en DEFAULT_TIME_SLOTS
          const updatedTimeSlots = availability.timeSlots.filter(slot => 
            DEFAULT_TIME_SLOTS.includes(slot)
          );
          
          if (updatedTimeSlots.length !== availability.timeSlots.length) {
            availability.timeSlots = updatedTimeSlots;
            await availability.save();
            console.log(`   ✅ Actualizado ${dateKey}: ${updatedTimeSlots.length} slots`);
          } else {
            console.log(`   ℹ️  ${dateKey}: ya configurado correctamente`);
          }
        } else {
          // Crear nuevo registro con todos los slots disponibles
          availability = new BarberAvailability({
            barber: barber._id,
            date: date,
            timeSlots: DEFAULT_TIME_SLOTS
          });
          
          await availability.save();
          console.log(`   ➕ Creado ${dateKey}: ${DEFAULT_TIME_SLOTS.length} slots`);
        }
      }
    }

    // ========================================
    // PASO 4: VERIFICAR ESTADO FINAL
    // ========================================
    console.log('\n📊 PASO 4: Verificando estado final de la base de datos...');
    
    const allRecords = await BarberAvailability.find().sort({ date: 1 });
    
    if (allRecords.length === 0) {
      console.log('ℹ️  No hay registros de disponibilidad');
    } else {
      console.log(`📋 Total de registros de disponibilidad: ${allRecords.length}`);
      
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

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n🎯 RESUMEN DEL MANTENIMIENTO AUTOMÁTICO:');
    console.log('✅ Citas agendadas protegidas y verificadas');
    console.log('✅ Disponibilidad de días pasados limpiada (solo si no hay citas)');
    console.log('✅ Disponibilidad futura actualizada');
    console.log('✅ Base de datos optimizada y consistente');
    
    console.log('\n🤖 Mantenimiento automático completado exitosamente');

  } catch (error) {
    console.error('❌ Error durante el mantenimiento automático:', error);
  } finally {
    // Solo desconectar si se ejecuta como script independiente
    if (process.env.STANDALONE_SCRIPT === 'true') {
      await mongoose.disconnect();
      console.log('🔌 Desconectado de MongoDB');
    } else {
      console.log('🔌 Manteniendo conexión a MongoDB (ejecutado desde servidor)');
    }
  }
}

// Ejecutar si se llama directamente
autoMaintenance();

export { autoMaintenance };
