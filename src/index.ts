import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import appointmentRoutes from './routes/appointments.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();

// CORS configuration - Simple and permissive
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: false
}));

app.use(express.json());

// Manual CORS headers for all requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Barbería API - Servidor funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Barbería API v1.0.0',
    endpoints: {
      users: '/api/users',
      appointments: '/api/appointments'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({ 
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/cors-test', (req, res) => {
  res.status(200).json({ 
    message: 'CORS POST test successful',
    body: req.body,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Routes test endpoint
app.get('/api/routes-test', (req, res) => {
  res.status(200).json({ 
    message: 'Routes test successful',
    availableRoutes: [
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/users/me',
      'PATCH /api/users/profile',
      'GET /api/appointments',
      'POST /api/appointments',
      'PUT /api/appointments/:id',
      'DELETE /api/appointments/:id'
    ],
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
connectDB().catch(console.error);

// Export for Vercel
export default app; 