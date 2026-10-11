# Starts the portable MySQL 8 server bundled in tools/ (no admin rights needed).
$base = Join-Path $PSScriptRoot "..\tools\mysql-8.0.40-winx64"
$base = (Resolve-Path $base).Path
$datadir = Join-Path $base "data"

if (-not (Test-Path $datadir)) {
    Write-Host "Initializing MySQL data directory for the first time..."
    New-Item -ItemType Directory -Force -Path $datadir | Out-Null
    & "$base\bin\mysqld.exe" --no-defaults --initialize-insecure --datadir="$datadir" --console
}

Write-Host "Starting MySQL on port 3306 (data dir: $datadir)..."
& "$base\bin\mysqld.exe" --no-defaults --datadir="$datadir" --port=3306 --console
