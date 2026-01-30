#!/bin/bash
# ============================================
# Glamo Platform - Deploy and Restart Script
# ============================================
# Script para deploy, configuração e reinício completo dos containers Docker

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_PATH="$PROJECT_ROOT/infrastructure/docker"
DATABASE_PATH="$PROJECT_ROOT/packages/database"

# Flags
CLEAN=false
SKIP_SEED=false
SKIP_BUILD=false
SHOW_LOGS=false

# ============================================
# FUNÇÕES
# ============================================

print_success() { echo -e "${GREEN}[✓] $1${NC}"; }
print_info() { echo -e "${CYAN}[i] $1${NC}"; }
print_warning() { echo -e "${YELLOW}[!] $1${NC}"; }
print_error() { echo -e "${RED}[✗] $1${NC}"; }
print_step() { 
    echo ""
    echo -e "${MAGENTA}========================================${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}========================================${NC}"
}

show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
   ██████╗ ██╗      █████╗ ███╗   ███╗ ██████╗ 
  ██╔════╝ ██║     ██╔══██╗████╗ ████║██╔═══██╗
  ██║  ███╗██║     ███████║██╔████╔██║██║   ██║
  ██║   ██║██║     ██╔══██║██║╚██╔╝██║██║   ██║
  ╚██████╔╝███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝
   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ 
                                               
         Deploy & Restart Script v1.0
EOF
    echo -e "${NC}"
}

show_help() {
    show_banner
    echo "USO: ./deploy.sh [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --clean       Remove volumes e recria tudo do zero"
    echo "  --skip-seed   Pula a execução do seed de dados"
    echo "  --skip-build  Pula o build do projeto"
    echo "  --logs        Mostra logs dos containers após iniciar"
    echo "  --help        Mostra esta mensagem de ajuda"
    echo ""
    exit 0
}

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker não está rodando. Por favor, inicie o Docker."
        exit 1
    fi
    print_success "Docker está rodando"
}

check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm não está instalado. Instalando..."
        npm install -g pnpm
    fi
    print_success "pnpm está disponível"
}

wait_for_postgres() {
    print_info "Aguardando PostgreSQL ficar disponível..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec glamo-postgres pg_isready -U postgres -d glamo_dev > /dev/null 2>&1; then
            print_success "PostgreSQL está pronto!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    
    print_error "Timeout aguardando PostgreSQL"
    return 1
}

wait_for_redis() {
    print_info "Aguardando Redis ficar disponível..."
    local max_attempts=20
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec glamo-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
            print_success "Redis está pronto!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    
    print_error "Timeout aguardando Redis"
    return 1
}

show_container_status() {
    print_step "STATUS DOS CONTAINERS"
    docker ps --filter "name=glamo-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

show_service_urls() {
    print_step "SERVIÇOS DISPONÍVEIS"
    echo ""
    echo "  🔵 PostgreSQL:       localhost:5555"
    echo "  🔴 Redis:            localhost:6379"
    echo "  📧 MailHog UI:       http://localhost:8025"
    echo "  🗄️  Adminer:          http://localhost:8080"
    echo "  📊 Redis Commander:  http://localhost:8081"
    echo ""
    echo -e "${YELLOW}  Para rodar a API:    pnpm dev:api${NC}"
    echo -e "${YELLOW}  Para rodar o Web:    pnpm dev:web${NC}"
    echo ""
}

setup_postgres_extensions() {
    print_info "Configurando extensões PostgreSQL..."
    docker cp "$DOCKER_PATH/setup-extensions.sql" glamo-postgres:/tmp/setup-extensions.sql 2>/dev/null
    docker exec glamo-postgres psql -U postgres -d glamo_dev -f /tmp/setup-extensions.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "Extensões PostgreSQL configuradas"
    else
        print_warning "Falha ao configurar extensões (tentando continuar...)"
    fi
}

# ============================================
# PARSE ARGS
# ============================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean) CLEAN=true; shift ;;
        --skip-seed) SKIP_SEED=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --logs) SHOW_LOGS=true; shift ;;
        --help|-h) show_help ;;
        *) echo "Opção desconhecida: $1"; show_help ;;
    esac
done

# ============================================
# INÍCIO DO SCRIPT
# ============================================

show_banner

# Verificar pré-requisitos
print_step "VERIFICANDO PRÉ-REQUISITOS"
check_docker
check_pnpm

# Navegar para o diretório do Docker
cd "$DOCKER_PATH"

# Parar containers existentes
print_step "PARANDO CONTAINERS"
print_info "Parando containers existentes..."
docker-compose down --remove-orphans 2>/dev/null || true
print_success "Containers parados"

# Limpeza (se solicitado)
if [ "$CLEAN" = true ]; then
    print_step "LIMPEZA COMPLETA"
    print_warning "Removendo volumes..."
    docker-compose down -v 2>/dev/null || true
    print_success "Volumes removidos"
fi

# Iniciar containers
print_step "INICIANDO CONTAINERS"
print_info "Iniciando serviços Docker..."
docker-compose up -d

if [ $? -ne 0 ]; then
    print_error "Falha ao iniciar containers"
    exit 1
fi

# Aguardar serviços
print_step "AGUARDANDO SERVIÇOS"
wait_for_postgres || exit 1
wait_for_redis || exit 1

# Configurar extensões PostgreSQL
setup_postgres_extensions

# Navegar para o root do projeto
cd "$PROJECT_ROOT"

# Configurar variáveis de ambiente
export DATABASE_URL="postgresql://postgres:postgres@localhost:5555/glamo_dev?schema=public"
export DIRECT_URL="postgresql://postgres:postgres@localhost:5555/glamo_dev?schema=public"

# Instalar dependências
print_step "INSTALANDO DEPENDÊNCIAS"
print_info "Executando pnpm install..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
print_success "Dependências instaladas"

# Build (se não for pulado)
if [ "$SKIP_BUILD" = false ]; then
    print_step "BUILD DO PROJETO"
    print_info "Gerando cliente Prisma..."
    cd "$DATABASE_PATH"
    pnpm db:generate
    
    if [ $? -ne 0 ]; then
        print_error "Falha ao gerar cliente Prisma"
        exit 1
    fi
    print_success "Cliente Prisma gerado"
fi

# Migrations
print_step "EXECUTANDO MIGRATIONS"
cd "$DATABASE_PATH"
print_info "Aplicando migrations do banco de dados..."
pnpm db:push

if [ $? -ne 0 ]; then
    print_error "Falha ao aplicar migrations"
    exit 1
fi
print_success "Migrations aplicadas"

# Seed (se não for pulado)
if [ "$SKIP_SEED" = false ]; then
    print_step "EXECUTANDO SEED"
    print_info "Populando banco de dados com dados iniciais..."
    pnpm db:seed 2>/dev/null || print_warning "Seed falhou ou não há seed configurado"
fi

# Voltar para o root
cd "$PROJECT_ROOT"

# Status final
show_container_status
show_service_urls

# Mostrar logs (se solicitado)
if [ "$SHOW_LOGS" = true ]; then
    print_step "LOGS DOS CONTAINERS"
    cd "$DOCKER_PATH"
    docker-compose logs -f --tail=50
fi

echo ""
print_success "Deploy concluído com sucesso!"
echo ""
