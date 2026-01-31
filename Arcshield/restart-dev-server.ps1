Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping existing dev server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop Node processes (be careful!)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting dev server with new config..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $scriptPath "frontend"

Set-Location $frontendPath

# Clear cache
if (Test-Path "node_modules\.cache") {
    Write-Host "Clearing cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}

Write-Host "Starting server..." -ForegroundColor Green
Write-Host ""

npm start
