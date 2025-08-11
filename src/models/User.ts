import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IServicePrices {
  haircut: number;
  haircutWithBeard: number;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'client' | 'barber' | 'admin';
  servicePrices?: IServicePrices;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['client', 'barber', 'admin'],
    default: 'client'
  },
  servicePrices: {
    haircut: {
      type: Number,
      default: 15000 // Precio por defecto para corte de cabello
    },
    haircutWithBeard: {
      type: Number,
      default: 25000 // Precio por defecto para corte + barba
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema); 