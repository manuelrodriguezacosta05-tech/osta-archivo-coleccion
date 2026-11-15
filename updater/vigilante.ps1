# Osta · Archivo de la colección — vigilante del juego.
# Se ejecuta oculto al iniciar sesión (tarea programada). Cuando Osta se abre o se cierra,
# lanza pipeline/update.py, que lee los guardados y publica en GitHub Pages si hay cambios.
$ErrorActionPreference = 'Continue'
$Root = Split-Path $PSScriptRoot -Parent
$Work = Join-Path $Root '.work'
$Log = Join-Path $Work 'logs\vigilante.log'
New-Item -ItemType Directory -Force (Split-Path $Log) | Out-Null

function Write-Log($msg) {
    if ((Test-Path $Log) -and (Get-Item $Log).Length -gt 1MB) { Move-Item $Log "$Log.old" -Force }
    Add-Content -Path $Log -Value ("{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg) -Encoding utf8
}

# Una sola instancia por usuario.
$mutex = New-Object System.Threading.Mutex($false, 'Local\OstaArchivoVigilante')
if (-not $mutex.WaitOne(0)) { exit 0 }

$cfg = Get-Content (Join-Path $Work 'config.json') -Raw | ConvertFrom-Json
if ($cfg.gitDir) { $env:Path = "$($cfg.gitDir);$env:Path" }
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONDONTWRITEBYTECODE = '1'

function Invoke-Update($reason) {
    Write-Log "Actualizando ($reason)…"
    $p = Start-Process -FilePath $cfg.python -ArgumentList @('-X', 'utf8', "`"$Root\pipeline\update.py`"", '--sync', '--reason', "`"$reason`"") `
        -WorkingDirectory $Root -WindowStyle Hidden -PassThru -Wait
    Write-Log "Fin de la actualización (código $($p.ExitCode)). Detalle en logs\actualizador.log"
}

$exe = 'Osta-Win64-Shipping'
$was = [bool](Get-Process -Name $exe -ErrorAction SilentlyContinue)
Write-Log "Vigilante iniciado. Juego abierto ahora: $was"
while ($true) {
    $running = [bool](Get-Process -Name $exe -ErrorAction SilentlyContinue)
    if ($running -and -not $was) {
        Write-Log 'Osta se ha abierto.'
        Start-Sleep -Seconds 20          # Steam ya sincronizó la nube antes de lanzar el juego
        Invoke-Update 'al abrir el juego'
    } elseif (-not $running -and $was) {
        Write-Log 'Osta se ha cerrado.'
        Start-Sleep -Seconds 25          # deja terminar el guardado y la subida a Steam Cloud
        Invoke-Update 'al cerrar el juego'
    }
    $was = $running
    Start-Sleep -Seconds 5
}
