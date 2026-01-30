<# 
.SYNOPSIS
    Glamo Platform - Deploy and Restart Script
.DESCRIPTION
    Script para deploy, configuração e reinício completo dos containers Docker da plataforma Glamo.
    Executa: stop containers -> rebuild -> start -> migrations -> seed -> health check
.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -SkipSeed
    .\deploy.ps1 -Clean
    .\deploy.ps1 -Logs
#>

param(
    [switch]$Clean,      # Remove volumes e recria tudo do zero
    [switch]$SkipSeed,   # Pula a execução do seed
    [switch]$SkipBuild,  # Pula o build do projeto
    [switch]$Logs,       # Mostra logs dos containers após iniciar
    [switch]$Help        # Mostra ajuda
)

# ============================================
# CONFIGURAÇÕES
# ============================================
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DockerPath = Join-Path $ProjectRoot "infrastructure\docker"
$DatabasePath = Join-Path $ProjectRoot "packages\database"

# Cores para output
function Write-Success { Write-Host "[✓] $args" -ForegroundColor Green }
function Write-Info { Write-Host "[i] $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "[!] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[✗] $args" -ForegroundColor Red }
function Write-Step { Write-Host "`n========================================" -ForegroundColor Magenta; Write-Host "  $args" -ForegroundColor Magenta; Write-Host "========================================" -ForegroundColor Magenta }

# ============================================
# BANNER
# ============================================
function Show-Banner {
    Write-Host @"

   ██████╗ ██╗      █████╗ ███╗   ███╗ ██████╗ 
  ██╔════╝ ██║     ██╔══██╗████╗ ████║██╔═══██╗
  ██║  ███╗██║     ███████║██╔████╔██║██║   ██║
  ██║   ██║██║     ██╔══██║██║╚██╔╝██║██║   ██║
  ╚██████╔╝███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝
   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ 
                                               
         Deploy & Restart Script v1.0
  
"@ -ForegroundColor Cyan
}

# ============================================
# HELP
# ============================================
if ($Help) {
    Show-Banner
    Write-Host "USO: .\deploy.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "OPTIONS:"
    Write-Host "  -Clean      Remove volumes e recria tudo do zero"
    Write-Host "  -SkipSeed   Pula a execução do seed de dados"
    Write-Host "  -SkipBuild  Pula o build do projeto"
    Write-Host "  -Logs       Mostra logs dos containers após iniciar"
    Write-Host "  -Help       Mostra esta mensagem de ajuda"
    Write-Host ""
    exit 0
}

# ============================================
# FUNÇÕES
# ============================================

function Test-DockerRunning {
    try {
        docker info 2>&1 | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-PnpmInstalled {
    try {
        pnpm --version 2>&1 | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Wait-ForPostgres {
    Write-Info "Aguardando PostgreSQL ficar disponível..."
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $result = docker exec glamo-postgres pg_isready -U postgres -d glamo_dev 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "PostgreSQL está pronto!"
                return $true
            }
        } catch {}
        
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
    
    Write-Error "Timeout aguardando PostgreSQL"
    return $false
}

function Wait-ForRedis {
    Write-Info "Aguardando Redis ficar disponível..."
    $maxAttempts = 20
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $result = docker exec glamo-redis redis-cli ping 2>&1
            if ($result -eq "PONG") {
                Write-Success "Redis está pronto!"
                return $true
            }
        } catch {}
        
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
    
    Write-Error "Timeout aguardando Redis"
    return $false
}

function Show-ContainerStatus {
    Write-Step "STATUS DOS CONTAINERS"
    docker ps --filter "name=glamo-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

function Show-ServiceUrls {
    Write-Step "SERVIÇOS DISPONÍVEIS"
    Write-Host ""
    Write-Host "  🔵 PostgreSQL:       localhost:5555" -ForegroundColor White
    Write-Host "  🔴 Redis:            localhost:6379" -ForegroundColor White
    Write-Host "  📧 MailHog UI:       http://localhost:8025" -ForegroundColor White
    Write-Host "  🗄️  Adminer:          http://localhost:8080" -ForegroundColor White
    Write-Host "  📊 Redis Commander:  http://localhost:8081" -ForegroundColor White
    Write-Host ""
    Write-Host "  Para rodar a API:    pnpm dev:api" -ForegroundColor Yellow
    Write-Host "  Para rodar o Web:    pnpm dev:web" -ForegroundColor Yellow
    Write-Host ""
}

function Setup-PostgresExtensions {
    Write-Info "Configurando extensões PostgreSQL..."
    $sqlScript = Join-Path $DockerPath "setup-extensions.sql"
    docker cp $sqlScript glamo-postgres:/tmp/setup-extensions.sql 2>&1 | Out-Null
    docker exec glamo-postgres psql -U postgres -d glamo_dev -f /tmp/setup-extensions.sql 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Extensões PostgreSQL configuradas"
    } else {
        Write-Warning "Falha ao configurar extensões (tentando continuar...)"
    }
}

# ============================================
# INÍCIO DO SCRIPT
# ============================================

Show-Banner

# Verificar pré-requisitos
Write-Step "VERIFICANDO PRÉ-REQUISITOS"

if (-not (Test-DockerRunning)) {
    Write-Error "Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
}
Write-Success "Docker está rodando"

if (-not (Test-PnpmInstalled)) {
    Write-Warning "pnpm não está instalado. Instalando..."
    npm install -g pnpm
}
Write-Success "pnpm está disponível"

# Navegar para o diretório do Docker
Set-Location $DockerPath

# Parar containers existentes
Write-Step "PARANDO CONTAINERS"
Write-Info "Parando containers existentes..."
docker-compose down --remove-orphans 2>&1 | Out-Null
Write-Success "Containers parados"

# Limpeza (se solicitado)
if ($Clean) {
    Write-Step "LIMPEZA COMPLETA"
    Write-Warning "Removendo volumes..."
    docker-compose down -v 2>&1 | Out-Null
    Write-Success "Volumes removidos"
}

# Iniciar containers
Write-Step "INICIANDO CONTAINERS"
Write-Info "Iniciando serviços Docker..."
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao iniciar containers"
    exit 1
}

# Aguardar serviços
Write-Step "AGUARDANDO SERVIÇOS"
$pgReady = Wait-ForPostgres
$redisReady = Wait-ForRedis

if (-not $pgReady -or -not $redisReady) {
    Write-Error "Serviços não iniciaram corretamente"
    docker-compose logs
    exit 1
}

# Configurar extensões PostgreSQL
Setup-PostgresExtensions

# Navegar para o root do projeto
Set-Location $ProjectRoot

# Configurar variáveis de ambiente
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5555/glamo_dev?schema=public"
$env:DIRECT_URL = "postgresql://postgres:postgres@localhost:5555/glamo_dev?schema=public"

# Instalar dependências
Write-Step "INSTALANDO DEPENDÊNCIAS"
Write-Info "Executando pnpm install..."
pnpm install --frozen-lockfile 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Executando pnpm install sem lockfile..."
    pnpm install
}
Write-Success "Dependências instaladas"

# Build (se não for pulado)
if (-not $SkipBuild) {
    Write-Step "BUILD DO PROJETO"
    Write-Info "Gerando cliente Prisma..."
    Set-Location $DatabasePath
    pnpm db:generate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao gerar cliente Prisma"
        exit 1
    }
    Write-Success "Cliente Prisma gerado"
}

# Migrations
Write-Step "EXECUTANDO MIGRATIONS"
Set-Location $DatabasePath
Write-Info "Aplicando migrations do banco de dados..."
pnpm db:push

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao aplicar migrations"
    exit 1
}
Write-Success "Migrations aplicadas"

# Seed (se não for pulado)
if (-not $SkipSeed) {
    Write-Step "EXECUTANDO SEED"
    Write-Info "Populando banco de dados com dados iniciais..."
    try {
        pnpm db:seed
        Write-Success "Seed executado com sucesso"
    } catch {
        Write-Warning "Seed falhou ou não há seed configurado (isso é normal na primeira vez)"
    }
}

# Voltar para o root
Set-Location $ProjectRoot

# Status final
Show-ContainerStatus
Show-ServiceUrls

# Mostrar logs (se solicitado)
if ($Logs) {
    Write-Step "LOGS DOS CONTAINERS"
    Set-Location $DockerPath
    docker-compose logs -f --tail=50
}

Write-Host ""
Write-Success "Deploy concluído com sucesso!"
Write-Host ""
