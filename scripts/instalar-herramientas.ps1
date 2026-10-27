# Instala las herramientas de desarrollo que no van en package.json.
#
#   powershell -ExecutionPolicy Bypass -File scripts/instalar-herramientas.ps1
#
# Descarga Engram (binario Go) y CodeGraph (motor nativo de tree-sitter) en
# `.tools/`, que está fuera de Git. El pipeline de CI no las necesita: son
# herramientas del agente, no de la aplicación.
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$tools = Join-Path $raiz ".tools"

$engramVersion = "3.6.0"
$codegraphVersion = "0.21.0"

New-Item -ItemType Directory -Force $tools | Out-Null

# ---------------------------------------------------------------------------
# Engram
# ---------------------------------------------------------------------------
$engramDir = Join-Path $tools "engram"
$engramExe = Join-Path $engramDir "engram.exe"

if ((Test-Path $engramExe) -and -not $Force) {
    Write-Host "Engram ya esta instalado: $engramExe"
} else {
    Write-Host "Descargando Engram $engramVersion..."
    $zip = Join-Path $env:TEMP "engram_$engramVersion.zip"
    $sums = Join-Path $env:TEMP "engram_checksums.txt"
    $base = "https://github.com/Gentleman-Programming/engram/releases/download/v$engramVersion"

    Invoke-WebRequest -Uri "$base/engram_${engramVersion}_windows_amd64.zip" -OutFile $zip
    Invoke-WebRequest -Uri "$base/checksums.txt" -OutFile $sums

    $esperado = (Get-Content $sums | Select-String "windows_amd64").Line.Split()[0]
    $real = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
    if ($esperado -ne $real) {
        throw "Checksum de Engram no coincide. Esperado $esperado, obtenido $real"
    }

    New-Item -ItemType Directory -Force $engramDir | Out-Null
    Expand-Archive -Path $zip -DestinationPath $engramDir -Force
    Write-Host "Engram instalado y verificado (SHA256 $real)."
}

# ---------------------------------------------------------------------------
# CodeGraph
# ---------------------------------------------------------------------------
$cgDir = Join-Path $tools "codegraph"
$cgEntrada = Join-Path $cgDir "node_modules\@astudioplus\codegraph-mcp\bin\codegraph-mcp.js"

if ((Test-Path $cgEntrada) -and -not $Force) {
    Write-Host "CodeGraph ya esta instalado: $cgEntrada"
} else {
    Write-Host "Instalando CodeGraph $codegraphVersion..."
    New-Item -ItemType Directory -Force $cgDir | Out-Null
    Push-Location $cgDir
    try {
        if (-not (Test-Path "package.json")) {
            '{"name":"tuki-tools","private":true}' | Set-Content package.json -Encoding utf8
        }
        npm install "@astudioplus/codegraph-mcp@$codegraphVersion" --no-audit --no-fund
    } finally {
        Pop-Location
    }
    Write-Host "CodeGraph instalado."
}

# ---------------------------------------------------------------------------
# Verificacion
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Verificando el handshake MCP..."
node (Join-Path $raiz "scripts\verificar-mcp.mjs")
if ($LASTEXITCODE -ne 0) {
    throw "Los servidores MCP no respondieron correctamente."
}
