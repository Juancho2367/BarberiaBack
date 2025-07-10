import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { connectDB } from './config/database.js';
import { 
  rateLimiter, 
  securityConfig, 
  getEnvironmentConfig 
} from './config/security.js';
import { corsMiddleware, corsErrorHandler, corsLogging } from './middleware/cors.js';
import { publicRouteHandler, getPublicRoutes } from './middleware/publicRoutes.js';
import appointmentRoutes from './routes/appointments.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();

// Get environment-specific configuration
const envConfig = getEnvironmentConfig();

// Security middleware - Apply before CORS
app.use(helmet(securityConfig));

// Rate limiting - Apply to all routes
app.use(rateLimiter);

// CORS logging middleware
app.use(corsLogging);

// Custom CORS middleware - Apply with environment-specific settings
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'} - IP: ${req.ip}`);
  next();
});

// Public routes handler - Must be before any auth middleware
app.use(publicRouteHandler);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Barbería API - Servidor funcionando correctamente',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.headers.origin,
      allowedOrigins: envConfig.isProduction ? 
        ['https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app'] : 
        ['http://localhost:3000', 'https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app']
    },
    frontend: {
      primary: 'https://barberia-front.vercel.app',
      current: 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app'
    }
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Barbería API v1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      public: [
        '/api/health',
        '/api/cors-test',
        '/api/routes-test',
        '/api/debug',
        '/api/users/register',
        '/api/users/login'
      ],
      protected: [
        '/api/users/me',
        '/api/users/profile',
        '/api/appointments'
      ]
    },
    cors: {
      origin: req.headers.origin,
      credentials: true,
      allowedOrigins: envConfig.isProduction ? 
        ['https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app'] : 
        ['http://localhost:3000', 'https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app']
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    cors: {
      origin: req.headers.origin,
      method: req.method,
      allowed: true,
      credentials: true
    },
    routes: {
      public: getPublicRoutes().length,
      total: getPublicRoutes().length + 6 // 6 rutas protegidas básicas
    }
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({ 
    message: 'CORS test successful',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString(),
    cors: {
      allowed: true,
      credentials: envConfig.corsOptions.credentials,
      allowedOrigins: envConfig.isProduction ? 
        ['https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app'] : 
        ['http://localhost:3000', 'https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app']
    }
  });
});

app.post('/api/cors-test', (req, res) => {
  res.status(200).json({ 
    message: 'CORS POST test successful',
    body: req.body,
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString(),
    cors: {
      allowed: true,
      credentials: envConfig.corsOptions.credentials,
      allowedOrigins: envConfig.isProduction ? 
        ['https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app'] : 
        ['http://localhost:3000', 'https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app']
    }
  });
});

// Routes test endpoint
app.get('/api/routes-test', (req, res) => {
  res.status(200).json({ 
    message: 'Routes test successful',
    environment: process.env.NODE_ENV || 'development',
    publicRoutes: getPublicRoutes(),
    protectedRoutes: [
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

// Debug endpoint to test all HTTP methods
app.all('/api/debug', (req, res) => {
  res.status(200).json({
    method: req.method,
    url: req.url,
    path: req.path,
    isPublicRoute: getPublicRoutes().includes(req.path),
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      authorization: req.headers.authorization ? 'Bearer [HIDDEN]' : undefined
    },
    body: req.body,
    query: req.query,
    params: req.params,
    cors: {
      origin: req.headers.origin,
      allowed: true
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    environment: process.env.NODE_ENV || 'development',
    publicRoutes: getPublicRoutes(),
    protectedRoutes: [
      'GET /api/users/me',
      'PATCH /api/users/profile',
      'GET /api/appointments',
      'POST /api/appointments',
      'PUT /api/appointments/:id',
      'DELETE /api/appointments/:id'
    ],
    cors: {
      origin: req.headers.origin,
      allowedOrigins: envConfig.isProduction ? 
        ['https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app'] : 
        ['http://localhost:3000', 'https://barberia-front.vercel.app', 'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app']
    },
    timestamp: new Date().toISOString()
  });
});

// CORS error handling middleware
app.use(corsErrorHandler);

// General error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  // Rate limit error handling
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests from this IP',
      retryAfter: err.headers?.['retry-after'] || '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
connectDB().catch(console.error);

// Export for Vercel
export default app; 