# CCM App — Sistema Web

> Stack: React + Vite + Bootstrap (frontend) · Python + FastAPI (backend) · MySQL (nuvem)

---

## Pré-requisitos

- Docker e Docker Compose instalados
- Acesso ao banco MySQL em nuvem
- Python 3.12+ com `uv` (apenas para desenvolvimento local)
- Node.js 20+ (apenas desenvolvimento local do frontend)

---

## Configuração

### 1. Variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com as credenciais reais
```

Gerar JWT_SECRET seguro:
```bash
python -c "import secrets; print(secrets.token_hex(64))"
```

### 2. Criar tabela de usuários no MySQL

```bash
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < backend/src/infrastructure/db/migrate.sql
```

Usuário admin inicial:
- **E-mail:** `admin@ccm.com.br`
- **Senha:** `Admin@1234` ← TROCAR após o primeiro acesso

---

## Executar com Docker

```bash
docker compose up --build -d
docker compose logs -f
```

Aplicação: `http://localhost:8080`  
Swagger da API: `http://localhost:3001/api/docs`

---

## Deploy no Easypanel

1. Crie um serviço **Docker Compose** no Easypanel
2. Aponte para o repositório Git deste projeto
3. Configure as variáveis de ambiente via painel (usar `.env.example` como referência)
4. Configure o domínio para a porta `80` do container `frontend`
5. Faça o deploy

---

## Desenvolvimento local (sem Docker)

```bash
# Backend
cd backend && uv sync
cp .env.example .env
uv run uvicorn src.main:app --reload --port 3001

# Frontend (outro terminal)
cd frontend && npm install && npm run dev
```

---

*CCM Tecnologia · Sistema interno · v1.0.0*
