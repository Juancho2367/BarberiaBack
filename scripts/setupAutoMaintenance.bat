@echo off
echo ========================================
echo 🤖 CONFIGURADOR DE MANTENIMIENTO AUTOMATICO
echo ========================================
echo.

REM Obtener la ruta actual del proyecto
set "PROJECT_PATH=%~dp0.."
set "PROJECT_PATH=%PROJECT_PATH:~0,-1%"

echo 📁 Ruta del proyecto: %PROJECT_PATH%
echo.

REM Crear la tarea programada
echo 🔧 Creando tarea programada para mantenimiento diario...
echo.

REM Crear el comando completo
set "COMMAND=cd /d %PROJECT_PATH% && npm run auto-maintenance"

REM Crear la tarea usando schtasks
schtasks /create /tn "Barberia Auto Maintenance" /tr "cmd /c %COMMAND%" /sc daily /st 02:00 /ru "SYSTEM" /f

if %ERRORLEVEL% EQU 0 (
    echo ✅ Tarea programada creada exitosamente!
    echo.
    echo 📋 Detalles de la tarea:
    echo    Nombre: Barberia Auto Maintenance
    echo    Frecuencia: Diaria
    echo    Hora: 02:00 AM
    echo    Comando: %COMMAND%
    echo.
    echo 🔍 Para ver la tarea creada:
    echo    schtasks /query /tn "Barberia Auto Maintenance"
    echo.
    echo 🗑️  Para eliminar la tarea (si es necesario):
    echo    schtasks /delete /tn "Barberia Auto Maintenance" /f
    echo.
    echo 🚀 El mantenimiento se ejecutará automáticamente cada día a las 2:00 AM
) else (
    echo ❌ Error al crear la tarea programada
    echo.
    echo 💡 Alternativas:
    echo    1. Ejecutar como administrador
    echo    2. Crear manualmente en el Programador de tareas de Windows
    echo    3. Usar cron en WSL si tienes Linux
    echo.
    echo 📝 Comando manual para ejecutar:
    echo    %COMMAND%
)

echo.
echo ========================================
pause
