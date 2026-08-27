# 🎟️ Rifa Digital - Plataforma Multi-Tenant / SaaS de Rifas Online

Uma plataforma moderna, completa e escalável para criação, venda e gestão de rifas e sorteios digitais com **baixa automática via PIX**, integração com **Mercado Pago**, cotas manuais/automáticas, **cotas premiadas**, ranking de maiores compradores e **módulo de sorteio auditável**.

---

## 🚀 Tecnologias Utilizadas

### ⚡ Backend
- **Python 3.14+** com **FastAPI** (Performance assíncrona ultra rápida)
- **SQLAlchemy 2.0** + **SQLite** (Desenvolvimento local) / **PostgreSQL** pronto para produção
- **Pydantic v2** & **Pydantic Settings** (Validação estrita de dados)
- **PyJWT & Bcrypt** (Autenticação segura e RBAC: SuperAdmin, Organizador e Comprador)
- **Mercado Pago API v1** + **Simulador de Pagamento PIX Integrado**
- **Qrcode & Pillow** (Geração dinâmica de QR Code PIX em Base64)

### 🎨 Frontend
- **Next.js 15 (App Router)** com **TypeScript** e **React 19**
- **Tailwind CSS** (Tema Dark / Emerald com visual moderno de alta conversão)
- **Lucide Icons**
- **Canvas-Confetti** (Animações de vitória e cotas premiadas)
- **Axios** com interceptors automáticos para JWT

---

## ✨ Principais Funcionalidades

### 🌟 1. Para os Compradores / Participantes
- **Catálogo de Campanhas**: Visualização de campanhas com filtros por categoria, busca em tempo real e barra de progresso.
- **Página da Rifa Completa**:
  - Galeria de fotos em alta resolução.
  - Perfil do organizador com selo de verificado e botão direto de WhatsApp.
  - **Cotas Rápidas**: Pacotes pré-definidos (+10, +25, +50, +100, +250, +500) com **combos de desconto progressivo**.
  - **Seletor Manual no Mapa**: Grid interativo para selecionar números específicos (com status Disponível, Reservado, Pago ou Cota Premiada).
  - **Cotas Premiadas (Instant Prizes)**: Bilhetes da sorte que ganham prêmios instantâneos em dinheiro no PIX no momento da compra.
  - **Ranking de Top Compradores**: Incentivo para os participantes que compram mais cotas.
- **Checkout PIX com Baixa Automática**:
  - Geração de QR Code e código PIX Copia e Cola instantâneo.
  - Timer regressivo de 15 minutos com expiração automática de reservas não pagas.
  - Verificação de pagamento em tempo real (Polling).
  - **Simulador de Pagamento PIX** (1 clique para testar e aprovar compras no ambiente de desenvolvimento).
- **Meus Bilhetes**: Consulta rápida de bilhetes comprados digitando WhatsApp ou CPF.

### 🏢 2. Para os Organizadores (Multi-Tenant / Lojas)
- **Página de Loja Própria (`/o/[slug]`)**: Página personalizada com banner, logo, biografia, redes sociais e suas rifas ativas.
- **Painel do Organizador (`/dashboard`)**:
  - Métricas de faturamento bruto, faturamento líquido e saldo para saque.
  - Wizard completo para criar e lançar rifas em minutos.
  - Configuração de combos de desconto, cotas premiadas e prêmios de ranking.
  - **Módulo de Sorteio ao Vivo**: Sorteio auditado eletrônico ou validação pelo resultado oficial da **Loteria Federal**.
  - Configuração de chave PIX de recebimento e credenciais próprias do Mercado Pago.

### 👑 3. Para o Super Administrador da Plataforma (`/admin`)
- Visão macro de volume total transacionado e comissões arrecadadas pela plataforma.
- Gestão de todos os organizadores (aprovar/remover selo de verificado e ajustar comissões individuais).

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- **Python 3.10+** (com `py` ou `python` no PATH)
- **Node.js 18+** e **npm**

---

### Opção 1: Inicialização Rápida com Script

Execute o script para iniciar o Backend e o Frontend juntos:
```powershell
.\run-dev.ps1
```
Ou abra duas janelas do terminal e execute:
- **Janela 1 (Backend):** `.\start-backend.bat`
- **Janela 2 (Frontend):** `.\start-frontend.bat`

---

### Opção 2: Inicialização Manual Passo a Passo

#### 1. Iniciar o Backend (FastAPI):
```bash
# Entrar no diretório raiz do projeto
cd C:\Projetos\rifa-digital

# Ativar o ambiente virtual
backend\venv\Scripts\activate

# Iniciar o servidor FastAPI
python -m alembic upgrade head
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- A API estará disponível em: **`http://localhost:8000`**
- Documentação interativa (Swagger UI): **`http://localhost:8000/docs`**

#### 2. Iniciar o Frontend (Next.js):
```bash
cd C:\Projetos\rifa-digital\frontend
npm run dev
```
- O Frontend estará disponível em: **`http://localhost:3000`**

---

## 🔑 Contas de Demonstração (Seed Automático)

O banco de dados já inicializa automaticamente com dados realistas, rifas de carros, motos e PIX, e usuários prontos para uso:

| Perfil | E-mail | Senha | Acesso / URL |
|---|---|---|---|
| **Super Administrador** | `admin@rifadigital.com` | `admin123` | `/admin` |
| **Organizador 1** | `victor@rifas.com` | `organizador123` | `/dashboard` e `/o/premios-do-victor` |
| **Organizador 2** | `contato@autosonhos.com` | `organizador123` | `/dashboard` e `/o/autosonhos` |

---

## 📁 Estrutura do Repositório

```
rifa-digital/
├── backend/                  # API FastAPI (Python 3.14)
│   ├── app/
│   │   ├── models/           # Modelos SQLAlchemy (User, Tenant, Raffle, Order, Ticket, Financial)
│   │   ├── routers/          # Endpoints REST (auth, tenants, raffles, orders, tickets, admin)
│   │   ├── schemas/          # Schemas Pydantic v2
│   │   ├── services/         # Regras de negócio, Mercado Pago PIX, Simulador e Sorteio
│   │   ├── config.py         # Configurações e Variáveis de Ambiente
│   │   ├── database.py       # Conexão e Sessão com o Banco de Dados
│   │   ├── seed.py           # População inicial do banco
│   │   └── main.py           # Entrypoint da aplicação FastAPI
│   └── requirements.txt      # Dependências Python
│
├── frontend/                 # Aplicação Next.js 15 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Marketplace / Homepage
│   │   │   ├── rifas/[slug]/page.tsx  # Página detalhada da rifa & seletor de cotas
│   │   │   ├── meus-bilhetes/page.tsx # Consulta de bilhetes por telefone/CPF
│   │   │   ├── o/[slug]/page.tsx      # Storefront público do organizador
│   │   │   ├── dashboard/page.tsx     # Painel de gestão do organizador
│   │   │   ├── admin/page.tsx         # Painel geral do SuperAdmin
│   │   │   ├── login/page.tsx         # Login
│   │   │   ├── cadastro/page.tsx      # Cadastro de organizadores
│   │   │   └── globals.css            # Tema Dark & Tailwind CSS
│   │   ├── components/                # Navbar, Footer, RaffleCard, CheckoutModal PIX
│   │   ├── context/                   # AuthContext (JWT & Sessão)
│   │   └── lib/                       # Cliente Axios da API
│   └── package.json
│
├── run-dev.ps1               # Script PowerShell para iniciar Backend e Frontend
├── start-backend.bat         # Script Windows Batch para iniciar o Backend
├── start-frontend.bat        # Script Windows Batch para iniciar o Frontend
└── README.md                 # Documentação completa
```

## Verificações de qualidade

```powershell
# Backend
backend\venv\Scripts\python.exe -m alembic upgrade head
backend\venv\Scripts\python.exe -m pytest backend/tests -q

# Frontend
cd frontend
npm.cmd run build
```

O workflow de CI executa essas verificações automaticamente em pushes para `main` e em pull requests.
