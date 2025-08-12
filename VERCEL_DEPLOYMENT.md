# Despliegue en Vercel - Barbería API

## Configuración Actualizada

Este proyecto ha sido configurado específicamente para funcionar correctamente en Vercel, evitando los errores comunes de módulos y scripts.

## Cambios Realizados

### 1. Importaciones de Módulos
- Todas las importaciones ahora usan la extensión `.js` correcta
- Compatible con el sistema de módulos ES6 de Node.js

### 2. Scripts de Mantenimiento
- Los scripts no se ejecutan automáticamente durante el despliegue
- Solo se ejecutan cuando son llamados explícitamente
- Configuración condicional para entornos de producción

### 3. Configuración de Vercel
- `vercel.json` optimizado para el despliegue
- Configuración de funciones con límites apropiados
- Variables de entorno configuradas automáticamente

### 4. Archivos de Build
- `.vercelignore` para excluir archivos innecesarios
- Script de build específico para Vercel
- Configuración de TypeScript optimizada

## Variables de Entorno Requeridas

```bash
MONGODB_URI=tu_uri_de_mongodb
JWT_SECRET=tu_jwt_secret
NODE_ENV=production
VERCEL=1
```

## Comandos de Despliegue

### Despliegue Automático
```bash
vercel --prod
```

### Despliegue Manual
```bash
npm run vercel-build
vercel --prod
```

## Solución de Problemas

### Error: Cannot find module
- Verificar que todas las importaciones tengan extensión `.js`
- Asegurar que el archivo `vercel.json` esté configurado correctamente
- Verificar que no haya scripts ejecutándose durante el build

### Error: Script execution
- Los scripts de mantenimiento solo se ejecutan cuando se solicitan explícitamente
- En producción, las rutas cron están deshabilitadas por defecto
- Usar `ENABLE_CRON=true` si se necesitan las rutas cron

### Error: Build timeout
- El build está configurado para completarse rápidamente
- Solo se compilan los archivos necesarios
- Se excluyen archivos de desarrollo y testing

## Estructura del Proyecto en Vercel

```
/
├── src/
│   ├── index.ts          # Punto de entrada principal
│   ├── models/           # Modelos de MongoDB
│   ├── routes/           # Rutas de la API
│   ├── controllers/      # Controladores de lógica
│   ├── middleware/       # Middleware personalizado
│   └── config/           # Configuraciones
├── vercel.json           # Configuración de Vercel
├── .vercelignore         # Archivos a excluir
└── package.json          # Dependencias y scripts
```

## Endpoints Disponibles

### Públicos
- `GET /` - Información del servidor
- `GET /api/health` - Estado de salud
- `POST /api/users/register` - Registro de usuarios
- `POST /api/users/login` - Login de usuarios

### Protegidos (requieren autenticación)
- `GET /api/users/me` - Perfil del usuario actual
- `GET /api/appointments` - Lista de citas
- `POST /api/appointments` - Crear cita
- `GET /api/barber-availability/availability` - Disponibilidad del barbero

## Monitoreo y Logs

- Los logs detallados solo están disponibles en desarrollo
- En producción, solo se muestran errores críticos
- Usar el dashboard de Vercel para monitorear el rendimiento

## Mantenimiento

Para ejecutar tareas de mantenimiento manualmente:

```bash
# Solo en desarrollo o con ENABLE_CRON=true
curl -X POST https://tu-api.vercel.app/api/cron/manual-maintenance
```

## Soporte

Si encuentras problemas durante el despliegue:

1. Verificar que todas las variables de entorno estén configuradas
2. Revisar los logs de build en el dashboard de Vercel
3. Verificar que la base de datos MongoDB esté accesible
4. Confirmar que no haya scripts ejecutándose durante el build
