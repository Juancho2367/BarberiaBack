# Scripts de Gestión de Disponibilidad de Barberos

Este documento explica cómo usar los scripts para configurar y gestionar la disponibilidad de los barberos en el sistema.

## 🚀 Configuración Inicial de Disponibilidad

### Script: `setupDefaultAvailability.ts`

Este script configura la disponibilidad por defecto para todos los barberos registrados.

**Características:**
- Configura horarios de 8:00 a 19:00 (30 minutos por slot)
- Cubre las próximas 4 semanas (lunes a viernes)
- Crea un barbero de prueba si no hay ninguno registrado
- Elimina disponibilidad anterior y configura nueva

**Uso:**
```bash
cd server
npm run setup-availability
```

**Salida esperada:**
```
✅ Conectado a MongoDB: cluster0.xxxxx.mongodb.net
👥 Encontrados 2 barberos
📅 Configurando disponibilidad para 20 días laborables
🔄 Configurando disponibilidad para barbero: 686c26869222f6ccab0674ae
🗑️  Disponibilidad anterior eliminada para barbero: 686c26869222f6ccab0674ae
✅ 20 días de disponibilidad configurados para barbero: 686c26869222f6ccab0674ae
🎉 Configuración de disponibilidad por defecto completada
📊 Resumen:
   - Barberos configurados: 2
   - Días configurados: 20
   - Horarios por día: 23 slots
   - Total de slots: 920
```

## 🛠️ Gestión de Disponibilidad

### Script: `manageBarberAvailability.ts`

Este script permite a los barberos gestionar su disponibilidad removiendo o agregando slots específicos.

**Comandos disponibles:**

#### 1. Mostrar Disponibilidad Actual
```bash
npm run manage-availability -- show <barberId> [startDate] [endDate]
```

**Ejemplo:**
```bash
npm run manage-availability -- show 686c26869222f6ccab0674ae
npm run manage-availability -- show 686c26869222f6ccab0674ae 2025-08-12 2025-08-16
```

#### 2. Remover Slots de Disponibilidad
```bash
npm run manage-availability -- remove <barberId> <date> <timeSlots>
```

**Ejemplo:**
```bash
npm run manage-availability -- remove 686c26869222f6ccab0674ae 2025-08-12 "09:00,10:00,14:30"
```

#### 3. Agregar Slots de Disponibilidad
```bash
npm run manage-availability -- add <barberId> <date> <timeSlots>
```

**Ejemplo:**
```bash
npm run manage-availability -- add 686c26869222f6ccab0674ae 2025-08-12 "20:00,20:30"
```

## 📋 Horarios Configurados

### Slots por Defecto (8:00 - 19:00)
```
08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00, 11:30,
12:00, 12:30, 13:00, 13:30, 14:00, 14:30, 15:00, 15:30,
16:00, 16:30, 17:00, 17:30, 18:00, 18:30, 19:00
```

**Total: 23 slots por día**

### Días Laborables
- **Lunes a Viernes** (5 días por semana)
- **4 semanas** por defecto
- **Total: 20 días** configurados inicialmente

## 🔄 Flujo de Trabajo

### 1. Configuración Inicial
```bash
# Ejecutar una sola vez para configurar todo el sistema
npm run setup-availability
```

### 2. Gestión Diaria
```bash
# Ver disponibilidad actual
npm run manage-availability -- show <barberId>

# Remover slots no disponibles
npm run manage-availability -- remove <barberId> <date> "09:00,10:00"

# Agregar slots adicionales
npm run manage-availability -- add <barberId> <date> "20:00,20:30"
```

### 3. Verificación
```bash
# Verificar cambios realizados
npm run manage-availability -- show <barberId> <date> <date>
```

## 📊 Estructura de Datos

### BarberAvailability Model
```typescript
{
  barber: ObjectId,        // ID del barbero
  date: Date,              // Fecha del día
  timeSlots: string[],     // Array de horarios disponibles
  isAvailable: boolean     // Si hay slots disponibles
}
```

### Ejemplo de Respuesta
```json
{
  "2025-08-12": {
    "date": "2025-08-12",
    "availableSlots": ["08:00", "08:30", "10:00", "10:30"],
    "reservedSlots": ["09:00", "09:30"],
    "allSlots": ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"],
    "isAvailable": true
  }
}
```

## ⚠️ Notas Importantes

1. **Solo se guardan las excepciones**: Por defecto, todos los slots están disponibles
2. **Las citas se guardan por separado**: En el modelo `Appointment`
3. **Slots removidos**: Se guardan en `BarberAvailability` para persistencia
4. **Horarios fijos**: Solo se pueden configurar slots entre 8:00 y 19:00
5. **Días laborables**: Solo lunes a viernes están configurados por defecto

## 🚨 Solución de Problemas

### Error: "Cannot find module"
```bash
# Asegúrate de estar en el directorio server
cd server

# Instala dependencias si es necesario
npm install
```

### Error: "MongoDB connection failed"
```bash
# Verifica que el archivo .env tenga MONGODB_URI
# Verifica que MongoDB esté corriendo
```

### Error: "No barbers found"
```bash
# El script creará un barbero de prueba automáticamente
# O crea usuarios barberos manualmente primero
```

## 📞 Soporte

Si encuentras problemas con los scripts:

1. Verifica que MongoDB esté corriendo
2. Verifica que las dependencias estén instaladas
3. Revisa los logs del servidor
4. Verifica que los IDs de barberos sean válidos
