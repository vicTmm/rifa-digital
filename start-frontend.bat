@echo off
echo ==============================================
echo  INICIANDO FRONTEND (Next.js - Rifa Digital)
echo ==============================================
cd /d %~dp0\frontend
where node >nul 2>nul || (echo Node.js nao encontrado. Instale Node.js 22. & exit /b 1)
if not exist node_modules\.bin\next.cmd npm ci
if errorlevel 1 exit /b 1
npm run dev
pause
