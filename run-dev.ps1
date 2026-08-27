Write-Host "==============================================" -ForegroundColor Green
Write-Host "  INICIANDO RIFA DIGITAL (FULLSTACK SAAS)   " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend in background or new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; .\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend in background or new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm.cmd run dev"

Write-Host "Backend iniciado em:  http://localhost:8000 (Swagger: http://localhost:8000/docs)" -ForegroundColor Cyan
Write-Host "Frontend iniciado em: http://localhost:3000" -ForegroundColor Cyan
