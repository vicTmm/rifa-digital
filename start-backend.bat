@echo off
echo ==============================================
echo  INICIANDO BACKEND (FastAPI - Rifa Digital)
echo ==============================================
cd /d %~dp0
call backend\venv\Scripts\activate.bat
python -m alembic upgrade head
if errorlevel 1 exit /b %errorlevel%
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
