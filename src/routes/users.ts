import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

// Admin only routes
router.get('/', auth, checkRole(['admin']), getAllUsers);

export default router; 