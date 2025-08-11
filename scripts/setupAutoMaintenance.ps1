#Requires -Version 5.1
#Requires -RunAsAdministrator

param(
    [string]$Time = "02:00",
    [string]$Frequency = "Daily"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🤖 CONFIGURADOR DE MANTENIMIENTO AUTOMATICO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host

# Obtener la ruta actual del proyecto
$ProjectPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ProjectPath = (Get-Item $ProjectPath).FullName

Write-Host "📁 Ruta del proyecto: $ProjectPath" -ForegroundColor Green
Write-Host

# Crear el comando completo
$Command = "cd /d `"$ProjectPath`" && npm run auto-maintenance"
$TaskName = "Barberia Auto Maintenance"

Write-Host "🔧 Configurando mantenimiento automático..." -ForegroundColor Yellow
Write-Host

# Verificar si ya existe la tarea
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️  Ya existe una tarea programada con el nombre: $TaskName" -ForegroundColor Yellow
    Write-Host "📋 Detalles de la tarea existente:" -ForegroundColor Cyan
    Write-Host "   Estado: $($ExistingTask.State)" -ForegroundColor White
    Write-Host "   Última ejecución: $($ExistingTask.LastRunTime)" -ForegroundColor White
    Write-Host "   Próxima ejecución: $($ExistingTask.NextRunTime)" -ForegroundColor White
    Write-Host
    
    $Response = Read-Host "🔄 ¿Deseas reemplazarla? (y/n)"
    if ($Response -eq 'y' -or $Response -eq 'Y') {
        Write-Host "🗑️  Eliminando tarea existente..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "✅ Tarea anterior eliminada" -ForegroundColor Green
    } else {
        Write-Host "❌ Configuración cancelada" -ForegroundColor Red
        exit 0
    }
}

try {
    # Crear la acción de la tarea
    $Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c $Command" -WorkingDirectory $ProjectPath
    
    # Crear el trigger (diario a las 2:00 AM)
    $Trigger = New-ScheduledTaskTrigger -Daily -At $Time
    
    # Configurar la tarea para ejecutarse como SYSTEM
    $Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    # Configurar la tarea para reiniciar en caso de fallo
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)
    
    # Crear la tarea
    $Task = New-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description "Mantenimiento automático diario para el sistema de barbería"
    
    # Registrar la tarea
    Register-ScheduledTask -TaskName $TaskName -InputObject $Task -Force
    
    Write-Host "✅ Tarea programada creada exitosamente!" -ForegroundColor Green
    Write-Host
    Write-Host "📋 Detalles de la tarea:" -ForegroundColor Cyan
    Write-Host "   Nombre: $TaskName" -ForegroundColor White
    Write-Host "   Frecuencia: $Frequency" -ForegroundColor White
    Write-Host "   Hora: $Time" -ForegroundColor White
    Write-Host "   Comando: $Command" -ForegroundColor White
    Write-Host "   Usuario: SYSTEM" -ForegroundColor White
    Write-Host "   Reinicio automático: Sí (3 intentos)" -ForegroundColor White
    Write-Host
    
    Write-Host "🔍 Para ver la tarea creada:" -ForegroundColor Cyan
    Write-Host "   Get-ScheduledTask -TaskName `"$TaskName`"" -ForegroundColor White
    Write-Host
    Write-Host "📊 Para ver el historial de ejecución:" -ForegroundColor Cyan
    Write-Host "   Get-ScheduledTaskInfo -TaskName `"$TaskName`"" -ForegroundColor White
    Write-Host
    Write-Host "▶️  Para ejecutar la tarea manualmente:" -ForegroundColor Cyan
    Write-Host "   Start-ScheduledTask -TaskName `"$TaskName`"" -ForegroundColor White
    Write-Host
    Write-Host "⏸️  Para pausar la tarea:" -ForegroundColor Cyan
    Write-Host "   Disable-ScheduledTask -TaskName `"$TaskName`"" -ForegroundColor White
    Write-Host
    Write-Host "🗑️  Para eliminar la tarea:" -ForegroundColor Cyan
    Write-Host "   Unregister-ScheduledTask -TaskName `"$TaskName`" -Confirm:`$false" -ForegroundColor White
    Write-Host
    
    Write-Host "🚀 El mantenimiento se ejecutará automáticamente cada día a las $Time" -ForegroundColor Green
    
    # Mostrar información adicional
    Write-Host
    Write-Host "💡 Información adicional:" -ForegroundColor Yellow
    Write-Host "   - La tarea se ejecuta con privilegios de SYSTEM" -ForegroundColor White
    Write-Host "   - Se reinicia automáticamente en caso de fallo" -ForegroundColor White
    Write-Host "   - Funciona incluso si no hay usuarios conectados" -ForegroundColor White
    Write-Host "   - Se puede monitorear desde el Programador de tareas de Windows" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error al crear la tarea programada: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host
    Write-Host "💡 Alternativas:" -ForegroundColor Yellow
    Write-Host "   1. Verificar que se ejecute como administrador" -ForegroundColor White
    Write-Host "   2. Crear manualmente en el Programador de tareas de Windows" -ForegroundColor White
    Write-Host "   3. Usar el script .bat alternativo" -ForegroundColor White
    Write-Host
    Write-Host "📝 Comando manual para ejecutar:" -ForegroundColor Cyan
    Write-Host "   $Command" -ForegroundColor White
}

Write-Host
Write-Host "========================================" -ForegroundColor Cyan
Read-Host "Presiona Enter para continuar..."
