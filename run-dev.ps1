Write-Host "==============================================" -ForegroundColor Green
Write-Host "  INICIANDO RIFA DIGITAL (FULLSTACK SAAS)   " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendPython = Join-Path $Root "backend\venv\Scripts\python.exe"
$BackendRequirements = Join-Path $Root "backend\requirements.txt"
$FrontendRoot = Join-Path $Root "frontend"

if (-not (Test-Path $BackendPython)) {
    $PythonLauncher = Get-Command py -ErrorAction SilentlyContinue
    if (-not $PythonLauncher) {
        throw "Python não encontrado. Instale Python 3.13 e execute novamente."
    }
    Write-Host "Criando ambiente virtual do backend..." -ForegroundColor Yellow
    & py -3.13 -m venv (Join-Path $Root "backend\venv")
    if ($LASTEXITCODE -ne 0) {
        throw "Não foi possível criar o ambiente com Python 3.13."
    }
}

Write-Host "Sincronizando dependências do backend..." -ForegroundColor Yellow
& $BackendPython -m pip install -r $BackendRequirements
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao instalar as dependências do backend."
}

$Node = Get-Command node -ErrorAction SilentlyContinue
$Npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $Node -or -not $Npm) {
    throw "Node.js 22 e npm não foram encontrados. Instale-os e execute novamente."
}

if (-not (Test-Path (Join-Path $FrontendRoot "node_modules\.bin\next.cmd"))) {
    Write-Host "Instalando dependências do frontend..." -ForegroundColor Yellow
    Push-Location $FrontendRoot
    try {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao instalar as dependências do frontend."
        }
    }
    finally {
        Pop-Location
    }
}

& $BackendPython -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao aplicar as migrations do banco de dados."
}

# Start Backend in background or new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; .\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend in background or new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendRoot'; npm.cmd run dev"

Write-Host "Backend iniciado em:  http://localhost:8000 (Swagger: http://localhost:8000/docs)" -ForegroundColor Cyan
Write-Host "Frontend iniciado em: http://localhost:3000" -ForegroundColor Cyan
