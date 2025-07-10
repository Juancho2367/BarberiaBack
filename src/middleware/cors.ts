import { Request, Response, NextFunction } from 'express';

// CORS configuration following best practices
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Define allowed origins based on environment
  const allowedOrigins = isProduction 
    ? [
        'https://barberia-front.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://barberia-front.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      // Origin not allowed
      console.warn(`CORS preflight blocked: ${origin}`);
      return res.status(403).json({
        error: 'CORS Error',
        message: 'Origin not allowed',
        origin,
        timestamp: new Date().toISOString()
      });
    }

    // Set CORS headers for preflight
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Origin',
      'Accept',
      'Cache-Control',
      'X-File-Name'
    ].join(', '));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Requested-With');
    
    return res.status(200).end();
  }

  // Handle actual requests
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests with no origin
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Origin not allowed
    console.warn(`CORS request blocked: ${origin}`);
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin,
      timestamp: new Date().toISOString()
    });
  }

  // Set CORS headers for actual requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Requested-With');

  next();
};

// CORS error handler
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
      details: {
        allowedOrigins: process.env.NODE_ENV === 'production' 
          ? ['https://barberia-front.vercel.app']
          : ['http://localhost:3000', 'https://barberia-front.vercel.app']
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
  if (origin && !['http://localhost:3000', 'https://barberia-front.vercel.app'].includes(origin)) {
    console.warn(`[CORS WARNING] Unusual origin: ${origin} for ${method} ${path}`);
  }
  
  next();
}; 