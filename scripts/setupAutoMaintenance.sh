#!/bin/bash

echo "========================================"
echo "🤖 CONFIGURADOR DE MANTENIMIENTO AUTOMATICO"
echo "========================================"
echo

# Obtener la ruta actual del proyecto
PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "📁 Ruta del proyecto: $PROJECT_PATH"
echo

# Crear el comando completo
COMMAND="cd $PROJECT_PATH && npm run auto-maintenance"

echo "🔧 Configurando mantenimiento automático diario..."
echo

# Crear la entrada cron para ejecutar diariamente a las 2:00 AM
CRON_JOB="0 2 * * * $COMMAND"

# Verificar si ya existe la entrada cron
if crontab -l 2>/dev/null | grep -q "$PROJECT_PATH.*auto-maintenance"; then
    echo "⚠️  Ya existe una entrada cron para este proyecto"
    echo "📋 Entrada actual:"
    crontab -l 2>/dev/null | grep "$PROJECT_PATH.*auto-maintenance"
    echo
    echo "🔄 ¿Deseas reemplazarla? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Remover entrada existente
        crontab -l 2>/dev/null | grep -v "$PROJECT_PATH.*auto-maintenance" | crontab -
        echo "✅ Entrada anterior removida"
    else
        echo "❌ Configuración cancelada"
        exit 0
    fi
fi

# Agregar nueva entrada cron
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Tarea cron creada exitosamente!"
    echo
    echo "📋 Detalles de la tarea:"
    echo "   Frecuencia: Diaria"
    echo "   Hora: 02:00 AM"
    echo "   Comando: $COMMAND"
    echo
    echo "🔍 Para ver las tareas cron actuales:"
    echo "   crontab -l"
    echo
    echo "🗑️  Para eliminar la tarea (si es necesario):"
    echo "   crontab -l | grep -v '$PROJECT_PATH.*auto-maintenance' | crontab -"
    echo
    echo "🚀 El mantenimiento se ejecutará automáticamente cada día a las 2:00 AM"
else
    echo "❌ Error al crear la tarea cron"
    echo
    echo "💡 Alternativas:"
    echo "   1. Verificar permisos de crontab"
    echo "   2. Crear manualmente en crontab -e"
    echo "   3. Usar systemd timer en Linux moderno"
    echo
    echo "📝 Comando manual para ejecutar:"
    echo "   $COMMAND"
fi

echo
echo "========================================"
