import express from 'express';
import { autoMaintenance } from '../scripts/autoMaintenance.js';

const router = express.Router();

// Middleware para verificar si los scripts están habilitados
const checkScriptsEnabled = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const scriptsEnabled = process.env.ENABLE_CRON === 'true' || !isProduction;
  
  if (!scriptsEnabled) {
    return res.status(403).json({
      success: false,
      message: 'Scripts automáticos deshabilitados en producción',
      timestamp: new Date().toISOString(),
      enableWith: 'ENABLE_CRON=true'
    });
  }
  
  next();
};

// Endpoint que Vercel ejecutará automáticamente cada día a las 2:00 AM
router.get('/daily-maintenance', checkScriptsEnabled, async (req, res) => {
  try {
    console.log('🤖 Cron job iniciado por Vercel - Mantenimiento diario');
    
    // Ejecutar mantenimiento automático
    await autoMaintenance();
    
    res.status(200).json({
      success: true,
      message: 'Mantenimiento automático completado exitosamente',
      timestamp: new Date().toISOString(),
      executedBy: 'Vercel Cron Job'
    });
    
  } catch (error) {
    console.error('❌ Error en cron job de mantenimiento:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error durante el mantenimiento automático',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para ejecutar mantenimiento manualmente (para testing)
router.post('/manual-maintenance', checkScriptsEnabled, async (req, res) => {
  try {
    console.log('🔧 Mantenimiento manual iniciado');
    
    // Ejecutar mantenimiento automático
    await autoMaintenance();
    
    res.status(200).json({
      success: true,
      message: 'Mantenimiento manual completado exitosamente',
      timestamp: new Date().toISOString(),
      executedBy: 'Manual Request'
    });
    
  } catch (error) {
    console.error('❌ Error en mantenimiento manual:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error durante el mantenimiento manual',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para verificar estado del cron
router.get('/status', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const scriptsEnabled = process.env.ENABLE_CRON === 'true' || !isProduction;
  
  res.status(200).json({
    success: true,
    message: 'Cron endpoint funcionando correctamente',
    timestamp: new Date().toISOString(),
    nextScheduledRun: '02:00 AM (UTC) - Diario',
    status: {
      enabled: scriptsEnabled,
      environment: process.env.NODE_ENV || 'development',
      cronEnabled: scriptsEnabled
    },
    endpoints: {
      daily: '/api/cron/daily-maintenance',
      manual: '/api/cron/manual-maintenance',
      status: '/api/cron/status'
    },
    configuration: {
      enableScripts: 'ENABLE_CRON=true',
      currentValue: process.env.ENABLE_CRON || 'undefined'
    }
  });
});

export default router;
