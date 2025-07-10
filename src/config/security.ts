import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// CORS configuration following best practices
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://barberia-front.vercel.app',
      'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers)
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Origin',
    'Accept',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
};

// Security headers configuration
export const securityConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://barberia-back.vercel.app"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" as const },
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: '30d',
};

// Database configuration
export const dbConfig = {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/barberia',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isProduction,
    corsOptions: isProduction ? {
      ...corsOptions,
      origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return callback(null, true);
        
        const productionOrigins = [
          'https://barberia-front.vercel.app',
          'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app',
          process.env.FRONTEND_URL
        ].filter(Boolean);
        
        if (productionOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked production request from origin: ${origin}`);
          callback(new Error('Not allowed by CORS in production'));
        }
      }
    } : corsOptions,
    rateLimiter: isProduction ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 50, // More restrictive in production
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    }) : rateLimiter
  };
}; 