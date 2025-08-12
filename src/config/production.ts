export const productionConfig = {
  // Configuración específica para producción
  scripts: {
    // Deshabilitar ejecución automática de scripts en producción
    autoExecute: false,
    // Solo permitir scripts específicos
    allowedScripts: ['maintenance', 'cleanup']
  },
  
  // Configuración de logging
  logging: {
    level: 'info',
    enableDebug: false,
    enableScriptLogs: false
  },
  
  // Configuración de seguridad
  security: {
    // Deshabilitar endpoints de desarrollo en producción
    enableDevEndpoints: false,
    // Solo permitir métodos HTTP seguros
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
};

export default productionConfig;
