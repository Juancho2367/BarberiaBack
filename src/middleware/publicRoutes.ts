import { Request, Response, NextFunction } from 'express';

// Lista de rutas públicas que no requieren autenticación
const publicRoutes = [
  '/',
  '/api',
  '/api/health',
  '/api/cors-test',
  '/api/routes-test',
  '/api/debug',
  '/api/users/register',
  '/api/users/login',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

// Middleware para verificar si una ruta es pública
export const isPublicRoute = (path: string): boolean => {
  // Verificar rutas exactas
  if (publicRoutes.includes(path)) {
    return true;
  }
  
  // Verificar rutas que empiecen con patrones específicos
  const publicPatterns = [
    '/api/health',
    '/api/cors-test',
    '/api/routes-test',
    '/api/debug',
    '/api/users/register',
    '/api/users/login'
  ];
  
  return publicPatterns.some(pattern => path.startsWith(pattern));
};

// Middleware para manejar rutas públicas
export const publicRouteHandler = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // Si es una ruta pública, continuar sin verificar autenticación
  if (isPublicRoute(path)) {
    console.log(`[PUBLIC] ${req.method} ${path} - Public route, skipping auth`);
    return next();
  }
  
  // Si no es una ruta pública, continuar al siguiente middleware (probablemente auth)
  console.log(`[PROTECTED] ${req.method} ${path} - Protected route, auth required`);
  next();
};

// Función para obtener todas las rutas públicas
export const getPublicRoutes = (): string[] => {
  return [...publicRoutes];
}; 