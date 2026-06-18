# Belezzi — SaaS para Salões de Beleza

> Sistema completo de gestão e agendamento online para salões de beleza. Backend em FastAPI com arquitetura modular, filas assíncronas, notificações via WhatsApp e suporte a múltiplos salões.

---

## 🛠️ Stack

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

---

## 📐 Arquitetura

```
saas-salao/
├── backend/
│   ├── app/
│   │   ├── core/          # Configurações, segurança, banco de dados
│   │   ├── infra/         # Integrações externas (WhatsApp, S3, Redis)
│   │   ├── modulos/       # Domínios da aplicação
│   │   │   ├── auth/      # Autenticação JWT
│   │   │   ├── agendamentos/
│   │   │   ├── booking/   # Agendamento público (sem login)
│   │   │   ├── clientes/
│   │   │   ├── profissionais/
│   │   │   ├── servicos/
│   │   │   ├── salao/
│   │   │   ├── financeiro/
│   │   │   ├── relatorios/
│   │   │   └── usuarios/
│   │   └── tarefas/       # Tasks Celery (notificações, lembretes)
│   ├── migrations/        # Alembic
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              # React + Vite + TypeScript
├── nginx/                 # Reverse proxy
├── docker-compose.yml
├── docker-compose.prod.yml
└── DEPLOY.md
```

**Tecnologias principais:**
- **FastAPI** com SQLAlchemy async + asyncpg
- **Alembic** para migrations
- **Redis** para cache e broker de filas
- **Celery** para tarefas assíncronas (lembretes de agendamento, notificações)
- **Evolution API** para notificações via WhatsApp
- **AWS S3** (ou armazenamento local) para logos e fotos
- **Nginx** como reverse proxy em produção
- **Pydantic v2** para validação de dados

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Docker e Docker Compose instalados

### 1. Clone o repositório

```bash
git clone https://github.com/lucasaaarruda/saas-salao.git
cd saas-salao
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais (banco, JWT secret, WhatsApp API).

### 3. Suba os containers

```bash
docker compose up --build
```

- Backend: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Frontend: `http://localhost:5173`

### 4. Rode as migrations

```bash
docker compose exec backend alembic upgrade head
```

---

## ⚙️ Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `POSTGRES_DB` | Nome do banco de dados |
| `POSTGRES_USER` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL |
| `SECRET_KEY` | Chave JWT — gere com: `openssl rand -hex 32` |
| `REDIS_URL` | URL do Redis |
| `EVOLUTION_API_URL` | URL da instância Evolution API (WhatsApp) |
| `STORAGE_TYPE` | Tipo de storage: `local` ou `s3` |
| `AMBIENTE` | `development` ou `production` |

Consulte o arquivo [`.env.example`](.env.example) para a lista completa.

---

## 📋 Módulos do Sistema

| Módulo | Descrição |
|--------|-----------|
| **Auth** | Login, registro, refresh token JWT |
| **Salão** | Cadastro e configuração do salão |
| **Profissionais** | Gestão de profissionais e horários |
| **Serviços** | Catálogo de serviços e preços |
| **Clientes** | Cadastro e histórico de clientes |
| **Agendamentos** | Criação e gestão de agendamentos |
| **Booking** | Link público de agendamento (sem login) |
| **Financeiro** | Controle de caixa e relatórios |
| **Notificações** | Lembretes automáticos via WhatsApp (Celery) |

---

## 🐳 Deploy em produção

Consulte o guia completo em [DEPLOY.md](./DEPLOY.md).

---

## 📬 Contato

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/lucasaarruda)
