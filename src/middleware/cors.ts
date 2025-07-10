import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Lista de orígenes permitidos
const allowedOrigins = [
  'https://barberia-front.vercel.app',
  'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app',
  'https://barberia-front-ctrp97bgn-juan-davids-projects-3cf28ed7.vercel.app' // Nueva URL del frontend
];

// En desarrollo, permite localhost
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
}

// Configuración CORS optimizada
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permite solicitudes sin origen (ej. Postman, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verifica si el origen está en la lista blanca
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permite credenciales (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Origin',
    'Accept',
    'Cache-Control',
    'X-File-Name',
    'x-request-id'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 200 // Algunos navegadores legacy necesitan 200 en lugar de 204
};

// Middleware CORS principal usando la librería cors
export const corsMiddleware = cors(corsOptions);

// CORS error handler
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
      details: {
        allowedOrigins: allowedOrigins,
        requestMethod: req.method,
        requestPath: req.path,
        userAgent: req.headers['user-agent']
      }
    });
  }
  
  next(err);
};

// CORS logging middleware
export const corsLogging = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const method = req.method;
  const path = req.path;
  
  console.log(`[CORS] ${method} ${path} - Origin: ${origin || 'No origin'} - IP: ${req.ip}`);
  
  // Log CORS violations
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[CORS WARNING] Unusual origin: ${origin} for ${method} ${path}`);
  }
  
  next();
};

// Función para obtener orígenes permitidos (útil para debugging)
export const getAllowedOrigins = (): string[] => {
  return [...allowedOrigins];
}; 