import mongoose from 'mongoose';

interface IBarberAvailability {
  barber: mongoose.Types.ObjectId;
  date: Date;
  timeSlots: string[];
  isAvailable: boolean;
}

const barberAvailabilitySchema = new mongoose.Schema<IBarberAvailability>({
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlots: [{
    type: String,
    required: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
barberAvailabilitySchema.index({ barber: 1, date: 1 });

export default mongoose.model<IBarberAvailability>('BarberAvailability', barberAvailabilitySchema);
