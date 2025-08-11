import express from 'express';
import { autoMaintenance } from '../scripts/autoMaintenance.js';

const router = express.Router();

// Endpoint que Vercel ejecutará automáticamente cada día a las 2:00 AM
router.get('/daily-maintenance', async (req, res) => {
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
router.post('/manual-maintenance', async (req, res) => {
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
  res.status(200).json({
    success: true,
    message: 'Cron endpoint funcionando correctamente',
    timestamp: new Date().toISOString(),
    nextScheduledRun: '02:00 AM (UTC) - Diario',
    endpoints: {
      daily: '/api/cron/daily-maintenance',
      manual: '/api/cron/manual-maintenance',
      status: '/api/cron/status'
    }
  });
});

export default router;
