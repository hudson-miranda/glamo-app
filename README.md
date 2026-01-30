# 💇‍♀️ Glamo - Plataforma SaaS para Beleza e Estética

<div align="center">
  <img src="docs/assets/logo.svg" alt="Glamo Logo" width="120" />
  
  <p><strong>Gestão completa para salões de beleza, barbearias e clínicas de estética</strong></p>
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
  [![pnpm](https://img.shields.io/badge/pnpm-8.x-orange.svg)](https://pnpm.io/)
  [![Turborepo](https://img.shields.io/badge/Turborepo-2.x-blueviolet.svg)](https://turbo.build/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

## 📋 Visão Geral

O **Glamo** é uma plataforma SaaS multi-tenant projetada especificamente para o mercado de beleza e estética brasileiro. Oferece uma solução completa para gestão de agendamentos, clientes, profissionais, finanças e muito mais.

### ✨ Principais Funcionalidades

- 📅 **Agendamento Online** - Sistema inteligente com gestão de disponibilidade
- 👥 **Gestão de Clientes** - CRM completo com histórico e programa de fidelidade
- 💰 **Controle Financeiro** - Fluxo de caixa, comissões e relatórios
- 👩‍💼 **Gestão de Profissionais** - Agenda individual e controle de serviços
- 📊 **Relatórios e Analytics** - Dashboard com métricas em tempo real
- 📱 **Aplicativo Mobile** - Para gestores e profissionais
- 🔗 **Portal de Agendamento** - Página personalizada para clientes

---

## 🏗️ Estrutura do Monorepo

```
glamo/
├── apps/
│   ├── api/           # NestJS REST API
│   ├── web/           # Next.js Dashboard
│   ├── booking/       # Next.js Portal de Agendamento
│   └── mobile/        # React Native (Expo) App
├── packages/
│   ├── config/        # ESLint e TypeScript configs
│   ├── database/      # Prisma schema e client
│   ├── shared/        # Tipos, utils e constantes
│   ├── ui/            # Design System (shadcn/ui)
│   └── validators/    # Schemas Zod
└── infrastructure/
    ├── docker/        # Docker Compose
    ├── kubernetes/    # K8s manifests
    └── terraform/     # IaC
```

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20.x LTS
- pnpm 8.x
- Docker e Docker Compose
- PostgreSQL 15+ (ou use Docker)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/your-org/glamo.git
cd glamo

# Instale as dependências
pnpm install

# Inicie os serviços de infraestrutura
cd infrastructure/docker
docker-compose up -d
cd ../..

# Configure as variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Execute as migrations
pnpm db:migrate

# Seed do banco de dados (opcional)
pnpm db:seed

# Inicie em modo desenvolvimento
pnpm dev
```

### URLs de Desenvolvimento

| Serviço | URL |
|---------|-----|
| API | http://localhost:3333 |
| API Docs (Swagger) | http://localhost:3333/docs |
| Dashboard Web | http://localhost:3000 |
| Portal de Agendamento | http://localhost:3001 |
| MailHog (emails) | http://localhost:8025 |

---

## 📦 Apps & Packages

### Apps

| App | Descrição | Stack |
|-----|-----------|-------|
| `@glamo/api` | Backend REST API | NestJS, Prisma, PostgreSQL |
| `@glamo/web` | Dashboard administrativo | Next.js 14, React Query |
| `@glamo/booking` | Portal de agendamento | Next.js 14 |
| `@glamo/mobile` | App mobile | React Native, Expo |

### Packages

| Package | Descrição |
|---------|-----------|
| `@glamo/config` | Configurações ESLint e TypeScript |
| `@glamo/database` | Prisma client e schema |
| `@glamo/shared` | Tipos, utilities e constantes |
| `@glamo/ui` | Design System baseado em shadcn/ui |
| `@glamo/validators` | Schemas de validação Zod |

---

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia todos os apps em modo dev
pnpm dev --filter=api # Inicia apenas a API

# Build
pnpm build            # Build de todos os workspaces
pnpm build --filter=web # Build apenas do web

# Qualidade
pnpm lint             # Linting em todos os workspaces
pnpm typecheck        # Type checking
pnpm test             # Executa testes

# Banco de Dados
pnpm db:migrate       # Executa migrations
pnpm db:seed          # Seed do banco
pnpm db:studio        # Abre Prisma Studio
pnpm db:reset         # Reset do banco (dev only)

# Utilitários
pnpm clean            # Limpa caches e builds
pnpm format           # Formata código
```

---

## 🔐 Autenticação

O sistema utiliza JWT com refresh tokens:

```typescript
// Login
POST /api/v1/auth/login
{
  "email": "admin@demosalon.com",
  "password": "Admin@123"
}

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { ... }
}
```

---

## 📚 Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Guia de Contribuição](docs/CONTRIBUTING.md)
- [API Reference](http://localhost:3333/docs)
- [Design System](packages/ui/README.md)

---

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes com coverage
pnpm test:cov

# Testes E2E
pnpm test:e2e
```

---

## 🚢 Deploy

O projeto utiliza GitHub Actions para CI/CD:

- **CI**: Lint, Type Check, Build e Testes em cada PR
- **Deploy**: Automático para produção ao fazer merge na `main`

Veja `.github/workflows/` para detalhes.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Time

Desenvolvido com 💛 pela equipe Glamo.

---

<div align="center">
  <strong>Glamo</strong> - Transformando a gestão do seu negócio de beleza
</div>
