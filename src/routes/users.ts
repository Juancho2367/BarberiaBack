import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getBarbers
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/barbers', getBarbers);

// Protected routes
router.get('/me', auth, getProfile);
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

// Admin only routes
router.get('/', auth, checkRole(['admin']), getAllUsers);
router.get('/:id', auth, checkRole(['admin']), getUserById);
router.post('/create', auth, checkRole(['admin']), createUser);
router.patch('/:id', auth, checkRole(['admin']), updateUser);
router.delete('/:id', auth, checkRole(['admin']), deleteUser);

export default router; 