# Osta - Archivo de la coleccion - instalador del actualizador automatico.
# Uso en cualquier PC (una linea, en PowerShell):
#   irm https://raw.githubusercontent.com/manuelrodriguezacosta05-tech/osta-archivo-coleccion/main/updater/instalar.ps1 | iex
# Que hace: instala Git, Python y GitHub CLI si faltan; inicia sesion en GitHub (una vez);
# clona el repositorio; registra una tarea oculta al iniciar sesion que vigila el juego y
# publica la web al abrirlo y al cerrarlo; hace una primera lectura de prueba.
$ErrorActionPreference = 'Stop'
$Repo = 'manuelrodriguezacosta05-tech/osta-archivo-coleccion'
$Dest = if ($env:OSTA_ARCHIVO_DIR) { $env:OSTA_ARCHIVO_DIR } else { Join-Path $env:USERPROFILE 'OstaArchivo' }
$TaskName = 'Osta Archivo - actualizador'

function Step($t) { Write-Host "`n== $t" -ForegroundColor Cyan }
function Refresh-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }
function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Ensure($cmd, $wingetId) {
    Refresh-Path
    if (-not (Have $cmd)) {
        Write-Host "Instalando $wingetId..."
        winget install --id $wingetId -e --silent --accept-package-agreements --accept-source-agreements | Out-Host
        Refresh-Path
        if (-not (Have $cmd)) { throw "No se pudo instalar $wingetId. Instalalo a mano y vuelve a ejecutar." }
    }
}
function Find-Python {
    $fallback = $null
    foreach ($c in @('py', 'python', 'python3')) {
        $cmd = Get-Command $c -ErrorAction SilentlyContinue
        if (-not $cmd) { continue }
        $pyArgs = if ($c -eq 'py') { @('-3', '-c', 'import sys;print(sys.executable)') } else { @('-c', 'import sys;print(sys.executable)') }
        try { $exe = (& $cmd.Source @pyArgs 2>$null | Select-Object -Last 1).Trim() } catch { continue }
        if ($exe -and (Test-Path $exe) -and $exe -notmatch 'WindowsApps\\python') { return $exe }
        if ($exe -and (Test-Path $exe)) { $fallback = $exe }
    }
    return $fallback
}

Step 'Comprobando herramientas'
Ensure git 'Git.Git'
Ensure gh 'GitHub.cli'
$py = Find-Python
if (-not $py) {
    winget install --id Python.Python.3.13 -e --silent --accept-package-agreements --accept-source-agreements | Out-Host
    Refresh-Path; $py = Find-Python
    if (-not $py) { throw 'No se encontro Python 3 tras instalarlo. Abre una consola nueva y repite.' }
}
Write-Host "Git:    $((Get-Command git).Source)"
Write-Host "Python: $py"

Step 'Cuenta de GitHub'
gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Se abrira GitHub para autorizar este PC (copia el codigo que aparece).' -ForegroundColor Yellow
    gh auth login --web --git-protocol https --hostname github.com --scopes 'repo,workflow'
    if ($LASTEXITCODE -ne 0) { throw 'No se completo el inicio de sesion en GitHub.' }
}
gh auth setup-git | Out-Null

Step "Repositorio en $Dest"
if (Test-Path (Join-Path $Dest '.git')) {
    git -C $Dest fetch --quiet origin; git -C $Dest reset --quiet --hard origin/main
} else {
    if (Test-Path $Dest) { throw "$Dest existe y no es un clon del repositorio. Borralo o define OSTA_ARCHIVO_DIR." }
    git clone --quiet "https://github.com/$Repo.git" $Dest
}
$login = gh api user --jq .login
$id = gh api user --jq .id
git -C $Dest config user.name $login
git -C $Dest config user.email "$id+$login@users.noreply.github.com"

$work = Join-Path $Dest '.work'
New-Item -ItemType Directory -Force $work | Out-Null
@{ python = $py; gitDir = (Split-Path (Get-Command git).Source) } | ConvertTo-Json | Set-Content (Join-Path $work 'config.json') -Encoding utf8

Step 'Partidas de Osta'
$saves = Join-Path $env:LOCALAPPDATA 'Osta\Saved\SaveGames'
foreach ($f in 'Save1Home.sav', 'Save1AfghanHotel.sav', 'Save1FrenchHotel.sav') {
    $p = Join-Path $saves $f
    Write-Host ("{0,-22} {1}" -f $f, $(if (Test-Path $p) { (Get-Item $p).LastWriteTime } else { 'NO ENCONTRADO (abre el juego una vez para que Steam lo sincronice)' }))
}

Step 'Tarea al iniciar sesion'
$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$script = Join-Path $Dest 'updater\vigilante.ps1'
$action = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument "--headless `"$ps`" -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
    -Description 'Publica la web de la coleccion de Osta al abrir y cerrar el juego.' -Force | Out-Null
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*vigilante.ps1*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-ScheduledTask -TaskName $TaskName
Write-Host "Tarea '$TaskName' registrada y en marcha."

Step 'Primera lectura (sin publicar)'
$env:PYTHONIOENCODING = 'utf-8'
& $py -X utf8 (Join-Path $Dest 'pipeline\update.py') --no-push --force --reason 'prueba de instalacion'
git -C $Dest checkout --quiet -- . 2>$null
Write-Host "`nListo. La web se publicara sola al abrir y al cerrar Osta:" -ForegroundColor Green
Write-Host "  https://manuelrodriguezacosta05-tech.github.io/osta-archivo-coleccion/"
Write-Host "Registros: $work\logs"
