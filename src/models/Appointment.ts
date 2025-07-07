import mongoose from 'mongoose';

interface IAppointment {
  client: mongoose.Types.ObjectId;
  barber: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  service: string;
  duration: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const appointmentSchema = new mongoose.Schema<IAppointment>({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model<IAppointment>('Appointment', appointmentSchema); 