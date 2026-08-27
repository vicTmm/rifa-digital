@echo off
echo ==============================================
echo  INICIANDO BACKEND (FastAPI - Rifa Digital)
echo ==============================================
cd /d %~dp0
if not exist backend\venv\Scripts\python.exe (
  where py >nul 2>nul || (echo Python nao encontrado. Instale Python 3.13. & exit /b 1)
  py -3.13 -m venv backend\venv
  if errorlevel 1 exit /b 1
)
call backend\venv\Scripts\activate.bat
python -m pip install -r backend\requirements.txt
if errorlevel 1 exit /b 1
python -m alembic upgrade head
if errorlevel 1 exit /b 1
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
