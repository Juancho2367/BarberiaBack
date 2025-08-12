#!/bin/bash

echo "🚀 Iniciando build para Vercel..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    exit 1
fi

echo "📦 Instalando dependencias..."
npm ci --only=production

echo "🔨 Compilando TypeScript..."
npm run build

echo "✅ Build completado exitosamente para Vercel"
echo "📁 Archivos generados en dist/"

# Listar archivos generados
ls -la dist/ || echo "⚠️  No se encontró directorio dist/"
