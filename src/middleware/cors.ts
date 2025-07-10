import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Expresión regular para validar orígenes de Vercel
// Acepta:
// 1. https://barberia-front.vercel.app (Producción)
// 2. https://barberia-front-xxxxxxxx.vercel.app (Cualquier vista previa)
const corsOriginRegex = /^https:\/\/barberia-front(-[a-zA-Z0-9]+)?\.vercel\.app$/;

// Configuración CORS optimizada con regex
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permite solicitudes sin origen (ej. Postman, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    
    // En desarrollo, permite localhost
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    
    // Valida el origen contra nuestra expresión regular
    if (corsOriginRegex.test(origin)) {
      return callback(null, true); // Origen permitido
    }
    
    // Si no coincide, rechazar la solicitud
    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
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
        pattern: corsOriginRegex.toString(),
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
  if (origin && !corsOriginRegex.test(origin) && !origin.startsWith('http://localhost')) {
    console.warn(`[CORS WARNING] Unusual origin: ${origin} for ${method} ${path}`);
  }
  
  next();
};

// Función para obtener información de CORS (útil para debugging)
export const getAllowedOrigins = (): { pattern: string, description: string } => {
  return {
    pattern: corsOriginRegex.toString(),
    description: 'Regex pattern for Vercel frontend URLs (production + preview)'
  };
}; 