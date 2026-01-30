<# 
.SYNOPSIS
    Glamo Platform - Complete Docker Stack Deploy Script
.DESCRIPTION
    Script para deploy completo da plataforma Glamo via Docker.
    Inclui: API, Web, Dashboard, Booking, PostgreSQL, Redis, MailHog
.EXAMPLE
    .\deploy-docker.ps1
    .\deploy-docker.ps1 -Dev
    .\deploy-docker.ps1 -Prod -Build
    .\deploy-docker.ps1 -Clean
#>

param(
    [switch]$Dev,        # Usa docker-compose.dev.yml (desenvolvimento com hot-reload)
    [switch]$Prod,       # Usa docker-compose.yml (produção)
    [switch]$Build,      # Força rebuild das imagens
    [switch]$Clean,      # Remove volumes e recria tudo
    [switch]$Down,       # Apenas para os containers
    [switch]$Logs,       # Mostra logs após iniciar
    [switch]$Infra,      # Apenas infraestrutura (DB, Redis, etc)
    [switch]$Help        # Mostra ajuda
)

# ============================================
# CONFIGURAÇÕES
# ============================================
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

# Cores para output
function Write-Success { Write-Host "[✓] $args" -ForegroundColor Green }
function Write-Info { Write-Host "[i] $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "[!] $args" -ForegroundColor Yellow }
function Write-Err { Write-Host "[✗] $args" -ForegroundColor Red }
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
                                               
      Docker Stack Deploy Script v2.0
  
"@ -ForegroundColor Cyan
}

# ============================================
# HELP
# ============================================
if ($Help) {
    Show-Banner
    Write-Host "USO: .\deploy-docker.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "OPTIONS:"
    Write-Host "  -Dev        Modo desenvolvimento (hot-reload)"
    Write-Host "  -Prod       Modo produção (builds otimizados)"
    Write-Host "  -Build      Força rebuild das imagens Docker"
    Write-Host "  -Clean      Remove volumes e recria tudo"
    Write-Host "  -Down       Para todos os containers"
    Write-Host "  -Logs       Mostra logs após iniciar"
    Write-Host "  -Infra      Apenas infraestrutura (DB, Redis, MailHog)"
    Write-Host "  -Help       Mostra esta mensagem"
    Write-Host ""
    Write-Host "EXEMPLOS:"
    Write-Host "  .\deploy-docker.ps1 -Dev              # Desenvolvimento"
    Write-Host "  .\deploy-docker.ps1 -Prod -Build      # Produção com rebuild"
    Write-Host "  .\deploy-docker.ps1 -Infra            # Apenas banco e Redis"
    Write-Host "  .\deploy-docker.ps1 -Down             # Para tudo"
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

function Get-ComposeFile {
    if ($Dev) {
        return "docker-compose.dev.yml"
    } elseif ($Prod) {
        return "docker-compose.yml"
    } else {
        # Default: desenvolvimento
        return "docker-compose.dev.yml"
    }
}

function Get-Services {
    if ($Infra) {
        return "postgres redis mailhog adminer redis-commander"
    }
    return ""  # All services
}

function Wait-ForService {
    param([string]$Name, [string]$Check, [int]$MaxAttempts = 30)
    
    Write-Info "Aguardando $Name..."
    $attempt = 0
    
    while ($attempt -lt $MaxAttempts) {
        try {
            $result = Invoke-Expression $Check 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$Name está pronto!"
                return $true
            }
        } catch {}
        
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
    
    Write-Err "Timeout aguardando $Name"
    return $false
}

function Show-ServiceUrls {
    Write-Step "SERVIÇOS DISPONÍVEIS"
    Write-Host ""
    
    if (-not $Infra) {
        Write-Host "  🌐 Web App:          http://localhost:3000" -ForegroundColor White
        Write-Host "  📊 Dashboard:        http://localhost:3001" -ForegroundColor White
        Write-Host "  📅 Booking Portal:   http://localhost:3002" -ForegroundColor White
        Write-Host "  🔌 API:              http://localhost:3333" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "  🔵 PostgreSQL:       localhost:5555" -ForegroundColor Gray
    Write-Host "  🔴 Redis:            localhost:6379" -ForegroundColor Gray
    Write-Host "  📧 MailHog UI:       http://localhost:8025" -ForegroundColor Gray
    Write-Host "  🗄️  Adminer:          http://localhost:8080" -ForegroundColor Gray
    Write-Host "  📊 Redis Commander:  http://localhost:8081" -ForegroundColor Gray
    Write-Host ""
    
    if (-not $Infra) {
        Write-Host "  Login: admin@studio-glamo-demo.glamo.app / Glamo@2024" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ============================================
# INÍCIO DO SCRIPT
# ============================================

Show-Banner
Set-Location $ProjectRoot

# Verificar Docker
Write-Step "VERIFICANDO PRÉ-REQUISITOS"

if (-not (Test-DockerRunning)) {
    Write-Err "Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
}
Write-Success "Docker está rodando"

$composeFile = Get-ComposeFile
$services = Get-Services

Write-Info "Usando: $composeFile"

# Apenas parar containers
if ($Down) {
    Write-Step "PARANDO CONTAINERS"
    docker-compose -f $composeFile down --remove-orphans
    Write-Success "Containers parados"
    exit 0
}

# Limpeza completa
if ($Clean) {
    Write-Step "LIMPEZA COMPLETA"
    Write-Warning "Removendo containers e volumes..."
    docker-compose -f $composeFile down -v --remove-orphans 2>&1 | Out-Null
    Write-Success "Limpeza concluída"
}

# Parar containers existentes
Write-Step "PARANDO CONTAINERS EXISTENTES"
docker-compose -f $composeFile down --remove-orphans 2>&1 | Out-Null
Write-Success "Containers parados"

# Build (se necessário)
if ($Build) {
    Write-Step "BUILDING IMAGES"
    if ($services) {
        docker-compose -f $composeFile build $services.Split(" ")
    } else {
        docker-compose -f $composeFile build
    }
    Write-Success "Build concluído"
}

# Iniciar containers
Write-Step "INICIANDO CONTAINERS"
if ($services) {
    docker-compose -f $composeFile up -d $services.Split(" ")
} else {
    docker-compose -f $composeFile up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Err "Falha ao iniciar containers"
    exit 1
}

# Aguardar serviços de infraestrutura
Write-Step "AGUARDANDO SERVIÇOS"
Wait-ForService -Name "PostgreSQL" -Check "docker exec glamo-postgres pg_isready -U postgres -d glamo_dev"
Wait-ForService -Name "Redis" -Check "docker exec glamo-redis redis-cli ping"

# Executar extensões PostgreSQL
Write-Info "Configurando extensões PostgreSQL..."
docker cp "$ProjectRoot\infrastructure\docker\setup-extensions.sql" glamo-postgres:/tmp/setup-extensions.sql 2>&1 | Out-Null
docker exec glamo-postgres psql -U postgres -d glamo_dev -f /tmp/setup-extensions.sql 2>&1 | Out-Null
Write-Success "Extensões configuradas"

# Status
Write-Step "STATUS DOS CONTAINERS"
docker ps --filter "name=glamo-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Show-ServiceUrls

# Logs (se solicitado)
if ($Logs) {
    Write-Step "LOGS (Ctrl+C para sair)"
    if ($services) {
        docker-compose -f $composeFile logs -f $services.Split(" ")
    } else {
        docker-compose -f $composeFile logs -f
    }
}

Write-Host ""
Write-Success "Deploy concluído com sucesso!"
Write-Host ""
