param(
  [switch]$SinNavegador
)
<#
  Arranque completo de TukiTuki con un solo clic.

  Hace, en orden:
   1. Enciende Docker Desktop si hace falta.
   2. Levanta el stack (servicios, frontends, gateway de IA, visión, Grafana, Prometheus).
   3. Comprueba Ollama y sus modelos (tuki-chef y nomic-embed-text).
   4. Calienta el chatbot y comprueba la IA de visión (comida / no comida).
   5. Abre el túnel de Argo CD y lee su contraseña.
   6. Abre la app, Grafana, Prometheus y Argo en el navegador.
   7. Imprime todas las credenciales y URLs.

  Es idempotente: si algo ya está arriba, lo reutiliza.
#>

$ErrorActionPreference = 'Continue'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

# Los proxies locales (por ejemplo un SOCKS) rompen las llamadas a localhost.
$env:ALL_PROXY = ''
$env:HTTP_PROXY = ''
$env:HTTPS_PROXY = ''
$env:NO_PROXY = 'localhost,127.0.0.1'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$fallos = [System.Collections.Generic.List[string]]::new()
$script:argoUrl = ''
$script:argoClave = ''

function Titulo([string]$texto) {
  Write-Host ""
  Write-Host "=== $texto ===" -ForegroundColor Cyan
}

function Ok([string]$texto) {
  Write-Host "  [OK]    $texto" -ForegroundColor Green
}

function Aviso([string]$texto) {
  Write-Host "  [AVISO] $texto" -ForegroundColor Yellow
}

function Mal([string]$texto) {
  Write-Host "  [ERROR] $texto" -ForegroundColor Red
  $script:fallos.Add($texto)
}

function Esperar([string]$descripcion, [int]$segundos, [scriptblock]$condicion) {
  $inicio = Get-Date
  $limite = $inicio.AddSeconds($segundos)
  $siguienteAviso = $inicio.AddSeconds(15)
  while ((Get-Date) -lt $limite) {
    try {
      if (& $condicion) { return $true }
    } catch { }
    Start-Sleep -Milliseconds 1500
    # Un latido cada 15 s: si no, la ventana parece congelada y se cierra.
    if ((Get-Date) -ge $siguienteAviso) {
      $transcurrido = [int]((Get-Date) - $inicio).TotalSeconds
      Write-Host "    ... esperando $descripcion ($transcurrido s)" -ForegroundColor DarkGray
      $siguienteAviso = (Get-Date).AddSeconds(15)
    }
  }
  return $false
}

function CodigoHttp([string]$url, [int]$timeout = 5) {
  try {
    return (curl.exe -s -m $timeout --noproxy "*" -o NUL -w "%{http_code}" $url)
  } catch {
    return '000'
  }
}

function CodigoHttps([string]$url, [int]$timeout = 5) {
  try {
    return (curl.exe -sk -m $timeout --noproxy "*" -o NUL -w "%{http_code}" $url)
  } catch {
    return '000'
  }
}

<#
  Argo CD se instala desde quay.io / ghcr.io. En este equipo hay un mirror de
  registro configurado en containerd que responde 500, así que los pods quedan
  en ImagePullBackOff aunque las imágenes ya estén en el nodo. Si eso pasa, se
  cambia la política a IfNotPresent para que arranquen con lo local.
#>
function RepararArgoCd {
  $razones = kubectl -n argocd get pods -o jsonpath='{range .items[*]}{range .status.containerStatuses[*]}{.state.waiting.reason}{" "}{end}{end}' 2>$null
  if ("$razones" -notmatch 'ImagePullBackOff|ErrImagePull') { return $false }

  Write-Host "    Argo CD no puede descargar sus imágenes; uso las que ya están en el nodo..." -ForegroundColor DarkGray
  $nombresDeploy = kubectl -n argocd get deploy -o jsonpath='{.items[*].metadata.name}' 2>$null
  foreach ($d in ("$nombresDeploy" -split '\s+' | Where-Object { $_ })) {
    $nombresCont = kubectl -n argocd get deploy $d -o jsonpath='{.spec.template.spec.containers[*].name}' 2>$null
    $contenedores = @()
    foreach ($n in ("$nombresCont" -split '\s+' | Where-Object { $_ })) {
      $contenedores += [pscustomobject]@{ name = $n; imagePullPolicy = 'IfNotPresent' }
    }
    if ($contenedores.Count -eq 0) { continue }
    $parche = @{ spec = @{ template = @{ spec = @{ containers = $contenedores } } } } |
      ConvertTo-Json -Depth 10 -Compress
    kubectl -n argocd patch deploy $d --type=strategic -p $parche *> $null
  }
  kubectl -n argocd rollout status deploy/argocd-server --timeout=120s *> $null
  return $true
}

function AbrirTunelArgo([int]$puerto) {
  # Un port-forward de una ejecución anterior deja el puerto tomado pero muerto.
  Get-CimInstance Win32_Process -Filter "Name='kubectl.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -match 'port-forward' -and $_.CommandLine -match "$puerto" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

  $kubectl = (Get-Command kubectl -ErrorAction SilentlyContinue).Source
  if (-not $kubectl) { return $false }

  $registro = Join-Path $env:TEMP "tukituki-argo-$puerto.log"
  Start-Process -FilePath $kubectl `
    -ArgumentList @('-n', 'argocd', 'port-forward', 'svc/argocd-server', "${puerto}:443") `
    -WindowStyle Hidden -RedirectStandardOutput $registro -RedirectStandardError "$registro.err" | Out-Null

  return (Esperar "túnel de Argo CD" 45 { (CodigoHttps "https://localhost:$puerto") -ne '000' })
}

Write-Host ""
Write-Host "  TukiTuki · arranque completo" -ForegroundColor White
Write-Host "  ----------------------------" -ForegroundColor DarkGray

# ---------------------------------------------------------------------------
# 1. Docker
# ---------------------------------------------------------------------------
Titulo "1/7 · Docker"
docker info *> $null
if ($LASTEXITCODE -eq 0) {
  Ok "Docker ya estaba encendido."
} else {
  $dockerExe = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'
  if (Test-Path $dockerExe) {
    Start-Process -FilePath $dockerExe | Out-Null
    Ok "Abriendo Docker Desktop…"
  } else {
    Mal "No encontré Docker Desktop en $dockerExe"
  }

  $listo = Esperar "Docker" 180 { docker info *> $null; $LASTEXITCODE -eq 0 }
  if (-not $listo) {
    # En algunos equipos la distro de WSL se queda detenida aunque la app abra.
    wsl -d docker-desktop -e sh -c "echo listo" *> $null
    $listo = Esperar "Docker" 120 { docker info *> $null; $LASTEXITCODE -eq 0 }
  }

  if ($listo) { Ok "Docker listo." }
  else { Mal "Docker no arrancó. Ábrelo a mano y vuelve a ejecutar el .bat." }
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Titulo "Resumen"
  Write-Host "No puedo continuar sin Docker." -ForegroundColor Red
  exit 1
}

# ---------------------------------------------------------------------------
# 2. Stack principal y observabilidad
# ---------------------------------------------------------------------------
Titulo "2/7 · Stack de TukiTuki"

$legacy = docker ps -a --filter "name=^tukituki-ai-local$" --format "{{.Names}}"
if ($legacy) {
  docker rm -f tukituki-ai-local *> $null
  Ok "Quité un gateway suelto que ocupaba el puerto 8000."
}

# Si la interfaz cambió después de construir la imagen, se reconstruye sola.
$fuentesFront = @(
  'apps/web-comensal/src',
  'apps/panel-restaurante/src',
  'apps/admin-plataforma/src',
  'packages/experiencia-tuki/src',
  'packages/experiencia-tuki/estilos',
  'packages/api-cliente/src',
  'packages/dominio/src',
  'packages/ui-kit/src'
)
$ultimoCambio = (Get-ChildItem -Path $fuentesFront -Recurse -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
$creadaWeb = docker inspect -f '{{.Created}}' tukituki-web-comensal 2>$null

if ($ultimoCambio -and $creadaWeb) {
  try {
    $fechaImagen = [datetime]::Parse($creadaWeb).ToLocalTime()
    if ($ultimoCambio -gt $fechaImagen.AddMinutes(1)) {
      Write-Host "    La interfaz cambió; reconstruyendo frontends (2-4 min)…" -ForegroundColor DarkGray
      docker compose -f infra/docker/docker-compose.yml build web-comensal panel-restaurante admin-plataforma 2>&1 | Out-Host
      if ($LASTEXITCODE -ne 0) { Aviso "No se pudieron reconstruir los frontends; sigo con las imágenes actuales." }
    }
  } catch { }
}

docker compose -f infra/docker/docker-compose.yml up -d 2>&1 | Out-Host
if ($LASTEXITCODE -eq 0) { Ok "Servicios, frontends y gateways arriba." }
else { Mal "Falló docker compose del stack principal." }

docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml up -d 2>&1 | Out-Host
if ($LASTEXITCODE -eq 0) { Ok "Grafana y Prometheus arriba." }
else { Mal "Falló el stack de observabilidad." }

# ---------------------------------------------------------------------------
# 3. Esperar servicios
# ---------------------------------------------------------------------------
Titulo "3/7 · Esperando servicios"

$contenedores = @(
  'tukituki-postgresdb',
  'tukituki-rediscache',
  'tukituki-rustfsstorage',
  'tukituki-identidadbe',
  'tukituki-restaurantesbe',
  'tukituki-mediabe',
  'tukituki-pedidosbe',
  'tukituki-resenasbe',
  'tukituki-adminbe',
  'tukituki-ai-gatewaybe',
  'tukituki-visionbe',
  'tukituki-apigw',
  'tukituki-web-comensalfe',
  'tukituki-web-panelfe',
  'tukituki-web-adminfe',
  'tukituki-mon-prometheus',
  'tukituki-mon-grafana'
)

Write-Host "    Esperando a que arranquen los contenedores (1-2 min)…" -ForegroundColor DarkGray

$todos = Esperar "contenedores" 300 {
  $lineas = docker ps --format "{{.Names}}|{{.Status}}"
  $listos = $true
  foreach ($c in $contenedores) {
    $linea = $lineas | Where-Object { $_ -like "$c|*" } | Select-Object -First 1
    if (-not $linea) { $listos = $false; break }
    if ($linea -notmatch '\|Up ') { $listos = $false; break }
    if ($linea -match 'starting|unhealthy') { $listos = $false; break }
  }
  $listos
}

if ($todos) {
  Ok "Los $($contenedores.Count) contenedores están arriba y sanos."
} else {
  Aviso "Algunos contenedores todavía están arrancando:"
  docker ps -a --format "{{.Names}} | {{.Status}}" |
    Where-Object { $_ -match 'tukituki' } |
    ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
}

$webOk = Esperar "frontends" 60 {
  (CodigoHttp 'http://localhost:8081') -eq '200' -and
  (CodigoHttp 'http://localhost:8082') -eq '200' -and
  (CodigoHttp 'http://localhost:8083') -eq '200'
}
if ($webOk) { Ok "App, panel y admin responden." }
else { Aviso "Algún frontend aún no responde; el navegador lo reintentará." }

$grafanaOk = Esperar "Grafana" 60 { (CodigoHttp 'http://localhost:3000/api/health') -eq '200' }
if ($grafanaOk) { Ok "Grafana responde en 3000." }
else { Aviso "Grafana aún no responde." }

$promOk = Esperar "Prometheus" 30 { (CodigoHttp 'http://localhost:9090/-/healthy') -eq '200' }
if ($promOk) { Ok "Prometheus responde en 9090." }
else { Aviso "Prometheus aún no responde." }

# ---------------------------------------------------------------------------
# 4. IA de texto y chatbot (Ollama del contenedor)
# ---------------------------------------------------------------------------
Titulo "4/7 · IA de texto y chatbot"

# El gateway habla con el Ollama del contenedor (http://ollama:11434), que no
# publica puerto. Comprobar el Ollama del host daba un falso error aunque el
# chat funcionara, así que se valida el contenedor.
$ollamaContenedor = 'tukituki-ollamabe'
$ollamaOk = Esperar "Ollama del contenedor" 90 {
  $estado = docker ps --filter "name=^${ollamaContenedor}$" --format "{{.Status}}" 2>$null
  "$estado" -match 'healthy'
}

if ($ollamaOk) {
  Ok "Ollama del contenedor listo."

  $lista = (docker exec $ollamaContenedor ollama list 2>$null) -join "`n"
  if ("$lista" -match 'tuki-chef') { Ok "Modelo tuki-chef presente." }
  else { Aviso "Falta tuki-chef en el contenedor. Créalo con: ollama create tuki-chef -f services/ai-gateway/Modelfile" }

  if ("$lista" -match 'nomic-embed-text') { Ok "Modelo de embeddings presente." }
  else { Aviso "Falta nomic-embed-text en el contenedor. Instálalo con: ollama pull nomic-embed-text" }
} else {
  Aviso "El contenedor de Ollama no está sano; el chat puede tardar o fallar."
}

$cuerpo = @{
  prompt = 'Hola, responde en una frase.'
  system = 'Eres un asistente breve.'
  max_tokens = 12
} | ConvertTo-Json

$archivoCuerpo = Join-Path $env:TEMP 'tukituki-warmup.json'
[System.IO.File]::WriteAllText($archivoCuerpo, $cuerpo, (New-Object System.Text.UTF8Encoding($false)))

# Se usa curl y no Invoke-RestMethod: respeta --noproxy y no se cuelga con el
# proxy del sistema, que en este equipo apunta a un SOCKS local.
$calentar = {
  param([string]$archivo, [int]$timeout)
  $codigo = curl.exe -s -m $timeout --noproxy "*" -o NUL -w "%{http_code}" `
    -X POST 'http://localhost:8000/api/v1/ai/chat' `
    -H 'Content-Type: application/json' --data-binary "@$archivo"
  return ("$codigo".Trim() -eq '200')
}

Write-Host "    Calentando el chatbot (la primera vez puede tardar 20-90 s)…" -ForegroundColor DarkGray

$reloj = [Diagnostics.Stopwatch]::StartNew()
$caliente = & $calentar $archivoCuerpo 200

if (-not $caliente) {
  # Reconstruir solo sirve si el gateway no está sano. Si responde y aun así
  # falla, es que el modelo local tarda y reconstruirlo no arregla nada.
  if ((CodigoHttp 'http://localhost:8000/healthz') -ne '200') {
    Aviso "El gateway de IA no responde; lo reconstruyo con el código local…"
    docker compose -f infra/docker/docker-compose.yml build ai-gateway 2>&1 | Out-Host
    docker compose -f infra/docker/docker-compose.yml up -d ai-gateway 2>&1 | Out-Host
    $espera = Esperar "gateway de IA" 60 { (CodigoHttp 'http://localhost:8000/healthz') -eq '200' }
    if ($espera) { $caliente = & $calentar $archivoCuerpo 200 }
  } else {
    Aviso "El gateway responde, pero el modelo local tardó más de lo esperado."
  }
}

if ($caliente) {
  Ok "Chatbot caliente en $([math]::Round($reloj.Elapsed.TotalSeconds,1)) s: el modelo ya está cargado."
} else {
  Aviso "El primer mensaje del chat puede tardar unos segundos."
}

# ---------------------------------------------------------------------------
# 5. IA de visión (comida / no comida)
# ---------------------------------------------------------------------------
Titulo "5/7 · IA de visión"

$visionOk = Esperar "visión" 60 { (CodigoHttp 'http://localhost:8002/healthz') -eq '200' }
if ($visionOk) {
  try {
    $modelo = Invoke-RestMethod -Uri 'http://localhost:8002/api/v1/vision/modelo' -TimeoutSec 10
    $acc = $modelo.metricas.metricas.accuracy
    if ($acc) {
      $pct = [math]::Round([double]$acc * 100, 1)
      Ok "Visión lista: $($modelo.modelo) · $pct% de acierto (comida / no comida)."
    } else {
      Ok "Visión lista: $($modelo.modelo) (comida / no comida)."
    }
  } catch {
    Ok "Visión lista en 8002."
  }
} else {
  Mal "El servicio de visión no responde en 8002."
}

# ---------------------------------------------------------------------------
# 6. Argo CD
# ---------------------------------------------------------------------------
Titulo "6/7 · Argo CD"

$k8s = Esperar "Kubernetes" 120 { kubectl get nodes *> $null; $LASTEXITCODE -eq 0 }
if (-not $k8s) {
  Aviso "Kubernetes no está iniciado. Argo CD no se abrirá."
} else {
  $argoListo = Esperar "Argo CD" 45 {
    $r = kubectl -n argocd get deployment argocd-server -o jsonpath="{.status.readyReplicas}" 2>$null
    "$r".Trim() -eq '1'
  }

  if (-not $argoListo) {
    $reparado = RepararArgoCd
    if ($reparado) {
      Ok "Argo CD arrancó con las imágenes que ya estaban en el clúster."
    }
    $argoListo = Esperar "Argo CD" 120 {
      $r = kubectl -n argocd get deployment argocd-server -o jsonpath="{.status.readyReplicas}" 2>$null
      "$r".Trim() -eq '1'
    }
  }

  if (-not $argoListo) {
    Aviso "Argo CD no está corriendo en el clúster."
  } else {
    $puerto = 8085
    $url = "https://localhost:$puerto"
    $vivo = (CodigoHttps $url) -ne '000'

    if (-not $vivo) {
      $vivo = AbrirTunelArgo $puerto
    }

    if ($vivo) {
      $b64 = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>$null
      if ($b64) {
        $script:argoClave = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
      } else {
        $script:argoClave = 'zaLHbH2iZ-voREeI'
      }
      $script:argoUrl = $url
      Ok "Argo CD en $url (admin / $($script:argoClave))."
    } else {
      Aviso "No pude abrir el túnel de Argo CD en el puerto $puerto."
    }
  }
}

# ---------------------------------------------------------------------------
# 7. Navegador y resumen
# ---------------------------------------------------------------------------
Titulo "7/7 · Abriendo el navegador"

if ($SinNavegador -or $env:TUKI_SIN_NAVEGADOR -eq '1') {
  Aviso "Navegador omitido (modo de prueba)."
} else {
  Start-Process "http://localhost:8081" | Out-Null
  Start-Sleep -Seconds 1
  Start-Process "http://localhost:3000" | Out-Null
  Start-Sleep -Seconds 1
  Start-Process "http://localhost:9090" | Out-Null
  if ($script:argoUrl) {
    Start-Sleep -Seconds 1
    Start-Process $script:argoUrl | Out-Null
  }
  Ok "Pestañas abiertas."
}

Write-Host ""
Write-Host "================= CREDENCIALES =================" -ForegroundColor White
Write-Host "  App (comensal)  http://localhost:8081"
Write-Host "  Panel           http://localhost:8082   dueno1@tukituki.local / Demo12345"
Write-Host "  Admin           http://localhost:8083   admin@tukituki.local / Admin12345"
Write-Host "  API Gateway     http://localhost:8084"
Write-Host "  Grafana         http://localhost:3000   admin / admin"
Write-Host "  Prometheus      http://localhost:9090"
if ($script:argoUrl) {
  Write-Host "  Argo CD         $($script:argoUrl)   admin / $($script:argoClave)"
} else {
  Write-Host "  Argo CD         (no disponible)" -ForegroundColor DarkGray
}
Write-Host "  Visión          http://localhost:8002/api/v1/vision/clasificar"
Write-Host "  IA local        Ollama (contenedor) · tuki-chef + nomic-embed-text"
Write-Host "================================================" -ForegroundColor White

if ($fallos.Count -eq 0) {
  Write-Host ""
  Write-Host "  Todo arriba." -ForegroundColor Green
  exit 0
}

Write-Host ""
Write-Host "  Terminó con avisos:" -ForegroundColor Yellow
foreach ($f in $fallos) { Write-Host "   - $f" -ForegroundColor Yellow }
exit 1
