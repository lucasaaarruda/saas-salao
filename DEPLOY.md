# Deploy — Belezzi

Guia completo para colocar o sistema em produção do zero.

---

## 1. Infraestrutura necessária

### Servidor (VPS)

Recomendação: **Hetzner Cloud CX22**
- 2 vCPU, 4 GB RAM, 40 GB SSD
- ~R$ 25/mês (Europa) ou ~R$ 40/mês (região EUA)
- Site: https://www.hetzner.com/cloud
- Sistema operacional: **Ubuntu 22.04 LTS**

Alternativa: **DigitalOcean Basic** $12/mês (2 GB RAM) — aceita cartão nacional.

> Mínimo recomendado: 2 GB RAM. O sistema roda backend + celery + celery-beat + postgres + redis + nginx.

### Domínio

- `.com.br` → **Registro.br** (~R$ 40/ano): https://registro.br
- `.com` → **Namecheap** (~$10/ano): https://namecheap.com

---

## 2. Configurar o servidor

Conecte via SSH e execute:

```bash
# Atualizar o sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose (plugin)
apt install -y docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

---

## 3. Configurar DNS do domínio

No painel do seu registrador de domínio, crie dois registros A:

| Tipo | Nome | Valor          |
|------|------|----------------|
| A    | @    | IP_DO_SERVIDOR |
| A    | www  | IP_DO_SERVIDOR |

Aguarde a propagação (até 24h, normalmente menos de 1h).

---

## 4. Clonar o repositório

```bash
cd /opt
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git belezzi
cd belezzi
```

---

## 5. Criar o arquivo `.env`

```bash
cp .env.example .env
nano .env
```

Preencha **todos** os campos marcados com `TROQUE_AQUI`:

```env
# Banco de dados
POSTGRES_DB=salao_db
POSTGRES_USER=salao_user
POSTGRES_PASSWORD=SENHA_FORTE_AQUI
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://salao_user:SENHA_FORTE_AQUI@postgres:5432/salao_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT — gere com: openssl rand -hex 32
SECRET_KEY=RESULTADO_DO_OPENSSL_AQUI
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# WhatsApp — Evolution API
EVOLUTION_API_URL=https://evolution.seudominio.com.br
EVOLUTION_API_KEY=SUA_CHAVE_AQUI
EVOLUTION_INSTANCE=nome-da-instancia

# URL pública do frontend (com https após configurar SSL)
FRONTEND_URL=http://seudominio.com.br

# Aplicação
AMBIENTE=production
BACKEND_CORS_ORIGINS=["http://seudominio.com.br","http://www.seudominio.com.br"]
ALLOWED_HOSTS=["seudominio.com.br","www.seudominio.com.br"]
PRIMEIRO_ADMIN_EMAIL=seu@email.com
PRIMEIRO_ADMIN_SENHA=SENHA_FORTE_DO_ADMIN

# Storage
STORAGE_TYPE=local

# Frontend
VITE_API_URL=http://seudominio.com.br/api/v1
```

Gere a SECRET_KEY:
```bash
openssl rand -hex 32
```

---

## 6. Primeiro deploy (sem SSL)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Aguarde os containers subirem (~2-3 minutos) e verifique:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail=50
```

Acesse `http://IP_DO_SERVIDOR` no navegador para confirmar que o sistema está no ar.

---

## 7. Configurar SSL com Certbot

### 7.1 Instalar Certbot

```bash
apt install -y certbot
```

### 7.2 Gerar o certificado

```bash
certbot certonly --webroot \
  -w /var/lib/docker/volumes/belezzi_certbot_www/_data \
  -d seudominio.com.br \
  -d www.seudominio.com.br \
  --email seu@email.com \
  --agree-tos \
  --non-interactive
```

### 7.3 Ativar HTTPS no nginx

Edite `nginx/nginx.conf`, apague o conteúdo atual e substitua pelo bloco comentado no final do arquivo — trocando `seudominio.com.br` pelo seu domínio real.

Reinicie o nginx:
```bash
docker compose -f docker-compose.prod.yml restart nginx
```

### 7.4 Atualizar o `.env` para HTTPS

```env
FRONTEND_URL=https://seudominio.com.br
BACKEND_CORS_ORIGINS=["https://seudominio.com.br","https://www.seudominio.com.br"]
ALLOWED_HOSTS=["seudominio.com.br","www.seudominio.com.br"]
VITE_API_URL=https://seudominio.com.br/api/v1
```

Rebuilde o frontend (que embute a URL em build time):
```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### 7.5 Renovação automática do certificado

```bash
crontab -e
```

Adicione a linha:
```
0 3 * * * certbot renew --quiet && docker compose -f /opt/belezzi/docker-compose.prod.yml restart nginx
```

---

## 8. Primeiro admin

O admin é criado **automaticamente** na primeira vez que o backend sobe, usando as credenciais `PRIMEIRO_ADMIN_EMAIL` e `PRIMEIRO_ADMIN_SENHA` do `.env`. Não é necessário nenhum comando manual.

Confirme nos logs:
```bash
docker compose -f docker-compose.prod.yml logs backend | grep "Admin padrão"
```

---

## 9. Atualizar o sistema (deploys futuros)

```bash
cd /opt/belezzi
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

O comando `alembic upgrade head` roda automaticamente no startup do backend, aplicando novas migrations.

---

## 10. Comandos úteis

```bash
# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Logs de um serviço específico
docker compose -f docker-compose.prod.yml logs backend -f
docker compose -f docker-compose.prod.yml logs celery -f

# Reiniciar um serviço
docker compose -f docker-compose.prod.yml restart backend

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Parar e remover volumes (CUIDADO: apaga o banco)
docker compose -f docker-compose.prod.yml down -v
```

---

## Checklist de go-live

- [ ] VPS criado e acessível via SSH
- [ ] DNS configurado e propagado
- [ ] Repositório clonado em `/opt/belezzi`
- [ ] `.env` preenchido com todos os valores reais
- [ ] `docker compose up` funcionando sem erros
- [ ] Sistema acessível via HTTP
- [ ] Certificado SSL gerado
- [ ] Sistema acessível via HTTPS
- [ ] `.env` atualizado com URLs HTTPS e frontend rebuildo
- [ ] Login de admin funcionando
- [ ] Agendamento online testado (fluxo completo)
- [ ] WhatsApp (Evolution API) configurado e testado
