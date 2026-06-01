# ══════════════════════════════════════════════════════
#  Casa Certa — Script de aplicação da refatoração
#  PowerShell (Windows)
#  NÃO faz push para o GitHub.
# ══════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Casa Certa — Aplicando Refatoração     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Detecta raiz do projeto ──
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path "$ProjectDir\api") -or -not (Test-Path "$ProjectDir\frontend")) {
    Write-Host "❌  Erro: coloque este script na raiz do projeto casa-certa-2" -ForegroundColor Red
    Write-Host "    (deve conter as pastas api\ e frontend\)" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Projeto encontrado em: $ProjectDir" -ForegroundColor Cyan
Write-Host ""

# ── Cria backup com timestamp ──
$Timestamp  = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir  = "$ProjectDir\.backup-$Timestamp"
New-Item -ItemType Directory -Path "$BackupDir\api"             -Force | Out-Null
New-Item -ItemType Directory -Path "$BackupDir\frontend\js"     -Force | Out-Null
New-Item -ItemType Directory -Path "$BackupDir\frontend"        -Force | Out-Null

Write-Host "💾 Fazendo backup dos arquivos originais..." -ForegroundColor Yellow

$FilesToBackup = @(
    @{ Src = "api\server.js";            Dst = "api\server.js" },
    @{ Src = "frontend\js\api.js";       Dst = "frontend\js\api.js" },
    @{ Src = "frontend\js\site-init.js"; Dst = "frontend\js\site-init.js" },
    @{ Src = "frontend\js\imoveis.js";   Dst = "frontend\js\imoveis.js" },
    @{ Src = "frontend\agendar.html";    Dst = "frontend\agendar.html" }
)

foreach ($f in $FilesToBackup) {
    $src = "$ProjectDir\$($f.Src)"
    $dst = "$BackupDir\$($f.Dst)"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "   ✓ $($f.Src)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Backup salvo em: $BackupDir" -ForegroundColor Green
Write-Host ""

# ── Aplica os arquivos refatorados ──
# Os arquivos refatorados devem estar na pasta "arquivos-refatorados"
# dentro da raiz do projeto, ou na mesma pasta do script.
$RefatoradosDir = "$ProjectDir\arquivos-refatorados"

if (-not (Test-Path $RefatoradosDir)) {
    Write-Host "📂 Pasta 'arquivos-refatorados' não encontrada." -ForegroundColor Yellow
    Write-Host "   Crie a pasta '$RefatoradosDir' e coloque dentro:" -ForegroundColor Yellow
    Write-Host "   • api\server.js" -ForegroundColor White
    Write-Host "   • frontend\js\api.js" -ForegroundColor White
    Write-Host "   • frontend\js\site-init.js" -ForegroundColor White
    Write-Host "   • frontend\js\imoveis.js" -ForegroundColor White
    Write-Host "   • frontend\agendar.html" -ForegroundColor White
    Write-Host ""
    Write-Host "   Depois execute o script novamente." -ForegroundColor Yellow
    exit 0
}

Write-Host "📦 Aplicando arquivos refatorados..." -ForegroundColor Cyan

$FilesToApply = @(
    @{ Src = "api\server.js";            Dst = "api\server.js" },
    @{ Src = "frontend\js\api.js";       Dst = "frontend\js\api.js" },
    @{ Src = "frontend\js\site-init.js"; Dst = "frontend\js\site-init.js" },
    @{ Src = "frontend\js\imoveis.js";   Dst = "frontend\js\imoveis.js" },
    @{ Src = "frontend\agendar.html";    Dst = "frontend\agendar.html" }
)

$AllOk = $true
foreach ($f in $FilesToApply) {
    $src = "$RefatoradosDir\$($f.Src)"
    $dst = "$ProjectDir\$($f.Dst)"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "   ✓ $($f.Dst)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Não encontrado: $src" -ForegroundColor Red
        $AllOk = $false
    }
}

Write-Host ""

# ── Verifica sintaxe com node ──
Write-Host "🔍 Verificando sintaxe dos arquivos JS..." -ForegroundColor Cyan

$JsFiles = @(
    "api\server.js",
    "frontend\js\api.js",
    "frontend\js\site-init.js",
    "frontend\js\imoveis.js"
)

$SyntaxOk = $true
foreach ($f in $JsFiles) {
    $fullPath = "$ProjectDir\$f"
    $result = & node --check $fullPath 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ $f — sintaxe OK" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $f — ERRO: $result" -ForegroundColor Red
        $SyntaxOk = $false
    }
}

Write-Host ""

if (-not $SyntaxOk -or -not $AllOk) {
    Write-Host "⚠️  Problema detectado. Para restaurar o backup, execute:" -ForegroundColor Red
    foreach ($f in $FilesToBackup) {
        Write-Host "   Copy-Item '$BackupDir\$($f.Dst)' '$ProjectDir\$($f.Src)' -Force" -ForegroundColor White
    }
    exit 1
}

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅  Refatoração aplicada com sucesso!  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Lembre-se de configurar as variáveis na Vercel:" -ForegroundColor Yellow
Write-Host "   • JWT_SECRET          — string aleatória longa (mín. 32 chars)" -ForegroundColor White
Write-Host "   • CORS_ORIGIN         — ex: https://casa-certa.vercel.app" -ForegroundColor White
Write-Host "   • SUPABASE_URL        — URL do seu projeto Supabase" -ForegroundColor White
Write-Host "   • SUPABASE_SERVICE_KEY — chave service_role do Supabase" -ForegroundColor White
Write-Host ""
Write-Host "📌 Para subir ao GitHub quando estiver pronto:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'fix: corrige bugs críticos e refatora integração API'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White
Write-Host ""
