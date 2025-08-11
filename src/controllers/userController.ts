import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'client' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error getting profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Error getting users' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Error obteniendo usuario' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, servicePrices } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
    }

    // Actualizar campos del usuario
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (servicePrices) {
      user.servicePrices = {
        haircut: servicePrices.haircut || user.servicePrices?.haircut || 15000,
        haircutWithBeard: servicePrices.haircutWithBeard || user.servicePrices?.haircutWithBeard || 25000
      };
    }

    await user.save();

    // Remover password de la respuesta
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Prevenir eliminación de administradores
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'No se puede eliminar un administrador' });
    }

    await User.findByIdAndDelete(id);
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role = 'client', servicePrices } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear nuevo usuario
    const user = new User({
      name,
      email,
      password,
      phone,
      role,
      servicePrices: servicePrices || {
        haircut: 15000,
        haircutWithBeard: 25000
      }
    });

    await user.save();

    // Remover password de la respuesta
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Error creando usuario' });
  }
};

// Endpoint público para obtener solo los barberos (sin autenticación)
export const getBarbers = async (req: Request, res: Response) => {
  try {
    // Obtener solo usuarios con rol 'barber', sin información sensible
    const barbers = await User.find({ role: 'barber' })
      .select('_id name email phone servicePrices')
      .sort({ name: 1 });

    res.json({
      message: 'Barberos obtenidos exitosamente',
      barbers,
      count: barbers.length
    });
  } catch (error) {
    console.error('Get barbers error:', error);
    res.status(500).json({ message: 'Error obteniendo barberos' });
  }
}; 