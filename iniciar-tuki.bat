@echo off
chcp 65001 >nul
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title Tuki - entorno local

rem ============================================================================
rem  Arranca Tuki en local. Dos modos:
rem
rem    iniciar-tuki.bat          Docker Compose -> contenedores visibles en
rem                              Docker Desktop: tuki-frontend y tuki-backend.
rem                              App en http://localhost:8080
rem
rem    iniciar-tuki.bat /k8s     Kubernetes -> pods en el cluster + port-forward.
rem                              App en http://localhost:8081
rem
rem  Opciones:
rem    /rebuild   reconstruye las imagenes antes de arrancar
rem    /stop      detiene contenedores, port-forward y despliegue de Kubernetes
rem
rem  Variables opcionales:
rem    TUKI_MODO          compose (por defecto) o k8s
rem    TUKI_UI_PORT       puerto del navegador (8080 en compose, 8081 en k8s)
rem    TUKI_K8S_CONTEXT   contexto de kubectl (por defecto docker-desktop)
rem ============================================================================

set "TUKI_NAMESPACE=tuki"
set "TUKI_CONTEXT=%TUKI_K8S_CONTEXT%"
if not defined TUKI_CONTEXT set "TUKI_CONTEXT=docker-desktop"
set "MODO=%TUKI_MODO%"
if not defined MODO set "MODO=compose"
set "REBUILD=0"
set "STOP=0"

for %%A in (%*) do (
  if /i "%%~A"=="/k8s" set "MODO=k8s"
  if /i "%%~A"=="--k8s" set "MODO=k8s"
  if /i "%%~A"=="/compose" set "MODO=compose"
  if /i "%%~A"=="--compose" set "MODO=compose"
  if /i "%%~A"=="/rebuild" set "REBUILD=1"
  if /i "%%~A"=="--rebuild" set "REBUILD=1"
  if /i "%%~A"=="-r" set "REBUILD=1"
  if /i "%%~A"=="/stop" set "STOP=1"
  if /i "%%~A"=="--stop" set "STOP=1"
)

if /i "%MODO%"=="k8s" (
  set "TUKI_PORT=%TUKI_UI_PORT%"
  if not defined TUKI_PORT set "TUKI_PORT=8081"
  set "ETIQUETA_MODO=Kubernetes"
) else (
  set "TUKI_PORT=%TUKI_UI_PORT%"
  if not defined TUKI_PORT set "TUKI_PORT=8080"
  set "ETIQUETA_MODO=Docker Compose"
)

echo ============================================================
echo   Tuki - entorno local ^(%ETIQUETA_MODO%^)
echo ============================================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro el comando docker.
  echo Instala Docker Desktop y vuelve a intentarlo.
  goto :error
)

rem ---------------------------------------------------------------------------
rem  Leer .env.local sin imprimir secretos
rem ---------------------------------------------------------------------------
if not exist ".env.local" (
  echo [ERROR] No existe .env.local en:
  echo         %CD%
  echo Copia .env.example a .env.local y rellena las claves.
  goto :error
)

set "VITE_SUPABASE_URL="
set "VITE_SUPABASE_ANON_KEY="
set "GROQ_API_KEY="

for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env.local") do (
  if /i "%%A"=="VITE_SUPABASE_URL" set "VITE_SUPABASE_URL=%%B"
  if /i "%%A"=="VITE_SUPABASE_ANON_KEY" set "VITE_SUPABASE_ANON_KEY=%%B"
  if /i "%%A"=="GROQ_API_KEY" set "GROQ_API_KEY=%%B"
)

rem Quita comillas si el archivo las incluye.
set "VITE_SUPABASE_URL=%VITE_SUPABASE_URL:"=%"
set "VITE_SUPABASE_ANON_KEY=%VITE_SUPABASE_ANON_KEY:"=%"
set "GROQ_API_KEY=%GROQ_API_KEY:"=%"

echo [OK] .env.local leido.
echo.

rem ---------------------------------------------------------------------------
rem  Detener todo
rem ---------------------------------------------------------------------------
if "%STOP%"=="1" goto :detener

rem ---------------------------------------------------------------------------
rem  1. Docker Desktop
rem ---------------------------------------------------------------------------
echo [1/4] Comprobando Docker...
docker info >nul 2>&1
if not errorlevel 1 goto :docker_listo

echo       Docker no responde. Iniciando Docker Desktop...
set "DOCKER_DESKTOP="
if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" set "DOCKER_DESKTOP=%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
if not defined DOCKER_DESKTOP if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" set "DOCKER_DESKTOP=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"

if defined DOCKER_DESKTOP (
  start "" "%DOCKER_DESKTOP%"
) else (
  docker desktop start >nul 2>&1
)

call :esperar_docker 240
if errorlevel 1 (
  echo.
  echo [ERROR] Docker no respondio en 4 minutos.
  echo Abre Docker Desktop manualmente y revisa que el motor Linux este activo.
  goto :error
)

:docker_listo
for /f "delims=" %%T in ('docker info --format "{{.OSType}}" 2^>nul') do set "DOCKER_OS=%%T"
if /i not "%DOCKER_OS%"=="linux" (
  echo [ERROR] Docker Desktop no esta usando contenedores Linux ^(OSType=%DOCKER_OS%^).
  echo Cambia a "Linux containers" en el menu de Docker Desktop.
  goto :error
)
echo [OK] Docker listo.
echo.

rem ---------------------------------------------------------------------------
rem  2. Imagenes locales
rem ---------------------------------------------------------------------------
set "WEB_IMAGE=tuki:local-0.3.0"
set "GW_IMAGE=tuki-ai-gateway:local-0.3.0"

echo [2/4] Comprobando imagenes...
set "NEED_BUILD=%REBUILD%"
docker image inspect "%WEB_IMAGE%" >nul 2>&1
if errorlevel 1 set "NEED_BUILD=1"
docker image inspect "%GW_IMAGE%" >nul 2>&1
if errorlevel 1 set "NEED_BUILD=1"

if "%NEED_BUILD%"=="0" (
  echo [OK] Imagenes locales ya existen.
  goto :imagenes_listas
)

if not defined VITE_SUPABASE_URL goto :faltan_variables
if not defined VITE_SUPABASE_ANON_KEY goto :faltan_variables

echo       Construyendo %WEB_IMAGE% ^(puede tardar varios minutos^)...
docker build ^
  --build-arg "VITE_SUPABASE_URL=%VITE_SUPABASE_URL%" ^
  --build-arg "VITE_SUPABASE_ANON_KEY=%VITE_SUPABASE_ANON_KEY%" ^
  --build-arg "VITE_AI_GATEWAY_URL=/api" ^
  -t "%WEB_IMAGE%" .
if errorlevel 1 (
  echo [ERROR] Fallo el build de la imagen web.
  goto :error
)

echo       Construyendo %GW_IMAGE%...
docker build -t "%GW_IMAGE%" services\ai-gateway
if errorlevel 1 (
  echo [ERROR] Fallo el build de la imagen del gateway.
  goto :error
)

:imagenes_listas
echo.
if /i "%MODO%"=="k8s" goto :modo_k8s
goto :modo_compose

rem ---------------------------------------------------------------------------
rem  3a. Docker Compose: contenedores visibles en Docker Desktop
rem ---------------------------------------------------------------------------
:modo_compose
echo [3/4] Levantando contenedores tuki-frontend y tuki-backend...

docker compose version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Este Docker no incluye "docker compose".
  echo Actualiza Docker Desktop ^(v2 o superior^).
  goto :error
)

rem Las etiquetas del compose son <imagen>:<TUKI_VERSION>.
set "TUKI_VERSION=local-0.3.0"
set "TUKI_IMAGE=tuki"
set "AI_GATEWAY_IMAGE=tuki-ai-gateway"

docker compose --env-file .env.local up -d --remove-orphans --no-build
if errorlevel 1 (
  echo.
  echo [ERROR] Docker Compose no pudo levantar los contenedores.
  echo Si el puerto %TUKI_PORT% esta ocupado, ejecuta:
  echo   set TUKI_UI_PORT=8090 ^&^& iniciar-tuki.bat
  echo   iniciar-tuki.bat /stop
  goto :error
)

echo       Esperando a que los contenedores esten sanos...
call :esperar_contenedor tuki-backend 180
if errorlevel 1 (
  echo [ERROR] tuki-backend no llego a healthy.
  echo Revisa: docker logs tuki-backend
  goto :error
)
call :esperar_contenedor tuki-frontend 180
if errorlevel 1 (
  echo [ERROR] tuki-frontend no llego a healthy.
  echo Revisa: docker logs tuki-frontend
  goto :error
)
echo [OK] Contenedores sanos.
echo.

rem ---------------------------------------------------------------------------
rem  4a. Navegador
rem ---------------------------------------------------------------------------
echo [4/4] Abriendo la app...
call :esperar_app 90
if errorlevel 1 (
  echo [ERROR] La app no responde en http://localhost:%TUKI_PORT%
  echo Revisa: docker compose --env-file .env.local ps
  goto :error
)

start "" "http://localhost:%TUKI_PORT%"

echo.
echo ============================================================
echo   Tuki esta en marcha
echo ============================================================
echo   URL:          http://localhost:%TUKI_PORT%
echo   Modo:         Docker Compose
echo   Contenedores: tuki-frontend, tuki-backend
echo.
echo   Se ven en Docker Desktop ^> Containers y en:
echo     docker ps
echo     docker compose --env-file .env.local ps
echo     docker compose --env-file .env.local logs -f frontend backend
echo.
echo   Para detener todo:
echo     iniciar-tuki.bat /stop
echo.
echo   Para el despliegue en Kubernetes:
echo     iniciar-tuki.bat /k8s
echo.
echo   Nota: si antes ejecutaste /k8s, esos pods siguen activos.
echo   Ejecuta "iniciar-tuki.bat /stop" para no tener dos copias.
echo.
ping -n 11 127.0.0.1 >nul
exit /b 0

rem ---------------------------------------------------------------------------
rem  3b. Kubernetes
rem ---------------------------------------------------------------------------
:modo_k8s
where kubectl >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro el comando kubectl.
  echo Instala kubectl o habilita Kubernetes en Docker Desktop.
  goto :error
)

echo [3/4] Comprobando Kubernetes ^(%TUKI_CONTEXT%^)...
kubectl config get-contexts "%TUKI_CONTEXT%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No existe el contexto de kubectl "%TUKI_CONTEXT%".
  echo En Docker Desktop abre Settings ^> Kubernetes ^> Enable Kubernetes.
  echo Si usas otro cluster, define TUKI_K8S_CONTEXT antes de ejecutar.
  goto :error
)

kubectl config use-context "%TUKI_CONTEXT%" >nul 2>&1
call :esperar_k8s 240
if errorlevel 1 (
  echo.
  echo [ERROR] Kubernetes no tiene nodos Ready.
  echo Revisa Settings ^> Kubernetes en Docker Desktop o el estado del cluster.
  goto :error
)

rem En un cluster kind las imagenes no se comparten con el motor Docker.
if /i "%TUKI_CONTEXT:~0,5%"=="kind-" (
  set "KIND_CLUSTER=%TUKI_CONTEXT:~5%"
  where kind >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] El contexto es kind pero no se encontro el comando kind.
    goto :error
  )
  echo       Cargando imagenes en el cluster kind-%KIND_CLUSTER%...
  kind load docker-image "%WEB_IMAGE%" --name "%KIND_CLUSTER%"
  if errorlevel 1 (
    echo [ERROR] No se pudieron cargar las imagenes en kind.
    goto :error
  )
  kind load docker-image "%GW_IMAGE%" --name "%KIND_CLUSTER%"
  if errorlevel 1 (
    echo [ERROR] No se pudieron cargar las imagenes en kind.
    goto :error
  )
)

echo       Preparando el namespace y el secreto...
kubectl create namespace %TUKI_NAMESPACE% --dry-run=client -o yaml | kubectl apply -f - >nul
if errorlevel 1 (
  echo [ERROR] No se pudo crear el namespace %TUKI_NAMESPACE%.
  goto :error
)

kubectl get secret tuki-ai-gateway -n %TUKI_NAMESPACE% >nul 2>&1
if errorlevel 1 (
  if not defined GROQ_API_KEY (
    echo [ERROR] Falta GROQ_API_KEY en .env.local.
    echo El gateway no puede arrancar sin esa clave.
    goto :error
  )
  kubectl create secret generic tuki-ai-gateway ^
    --from-literal="GROQ_API_KEY=%GROQ_API_KEY%" ^
    -n %TUKI_NAMESPACE% >nul
  if errorlevel 1 (
    echo [ERROR] No se pudo crear el secreto tuki-ai-gateway.
    goto :error
  )
  echo       Secreto tuki-ai-gateway creado.
) else (
  echo       Secreto tuki-ai-gateway ya existe ^(no se sobrescribe^).
)

echo       Aplicando deploy/k8s/overlays/local...
kubectl apply -k deploy/k8s/overlays/local
if errorlevel 1 (
  echo [ERROR] Fallo kubectl apply.
  goto :error
)

rem Si se reconstruyeron las imagenes, reinicia para no quedarse con el pod viejo.
if "%NEED_BUILD%"=="1" (
  kubectl rollout restart deployment/tuki -n %TUKI_NAMESPACE% >nul 2>&1
  kubectl rollout restart deployment/tuki-ai-gateway -n %TUKI_NAMESPACE% >nul 2>&1
)

echo       Esperando a que los pods esten listos...
kubectl rollout status deployment/tuki -n %TUKI_NAMESPACE% --timeout=240s
if errorlevel 1 (
  echo [ERROR] El deployment tuki no llego a Ready.
  echo Revisa: kubectl describe pod -n %TUKI_NAMESPACE% -l app.kubernetes.io/name=tuki
  goto :error
)
kubectl rollout status deployment/tuki-ai-gateway -n %TUKI_NAMESPACE% --timeout=240s
if errorlevel 1 (
  echo [ERROR] El deployment tuki-ai-gateway no llego a Ready.
  echo Revisa: kubectl describe pod -n %TUKI_NAMESPACE% -l app.kubernetes.io/name=tuki-ai-gateway
  goto :error
)
echo [OK] Despliegue listo.
echo.

rem ---------------------------------------------------------------------------
rem  4b. Port-forward y navegador
rem ---------------------------------------------------------------------------
echo [4/4] Abriendo la app...

rem Cierra un port-forward anterior de Tuki para no chocar con el puerto.
call :cerrar_port_forward
ping -n 2 127.0.0.1 >nul

netstat -ano -p tcp | findstr /c:"LISTENING" | findstr /c:":%TUKI_PORT%" >nul
if not errorlevel 1 (
  echo [ERROR] El puerto %TUKI_PORT% ya esta ocupado por otro programa.
  echo Cierra ese programa o ejecuta con otro puerto, por ejemplo:
  echo   set TUKI_UI_PORT=8090 ^&^& iniciar-tuki.bat /k8s
  goto :error
)

start "Tuki - port-forward" /min cmd /c "kubectl port-forward -n %TUKI_NAMESPACE% svc/tuki %TUKI_PORT%:80"

call :esperar_app 90
if errorlevel 1 (
  echo [ERROR] La app no responde en http://localhost:%TUKI_PORT%
  echo Revisa la ventana "Tuki - port-forward" y ejecuta:
  echo   kubectl get pods -n %TUKI_NAMESPACE%
  goto :error
)

start "" "http://localhost:%TUKI_PORT%"

echo.
echo ============================================================
echo   Tuki esta en marcha
echo ============================================================
echo   URL:       http://localhost:%TUKI_PORT%
echo   Modo:      Kubernetes
echo   Contexto:  %TUKI_CONTEXT%
echo   Namespace: %TUKI_NAMESPACE%
echo.
echo   La ventana "Tuki - port-forward" mantiene el acceso a la app.
echo   Los pods se ven con:
echo     kubectl get pods -n %TUKI_NAMESPACE%
echo.
echo   Para detener todo:
echo     iniciar-tuki.bat /stop
echo.
echo   Si cambias el codigo o .env.local, ejecuta:
echo     iniciar-tuki.bat /k8s /rebuild
echo.
ping -n 11 127.0.0.1 >nul
exit /b 0

rem ---------------------------------------------------------------------------
rem  Detener todo
rem ---------------------------------------------------------------------------
:detener
echo [1/3] Deteniendo contenedores de Docker Compose...
docker rm -f tuki-frontend tuki-backend >nul 2>&1
echo [2/3] Cerrando port-forward...
call :cerrar_port_forward
ping -n 2 127.0.0.1 >nul

echo [3/3] Deteniendo el despliegue de Kubernetes...
where kubectl >nul 2>&1
if errorlevel 1 goto :detener_listo
kubectl config get-contexts "%TUKI_CONTEXT%" >nul 2>&1
if errorlevel 1 goto :detener_listo
kubectl config use-context "%TUKI_CONTEXT%" >nul 2>&1
kubectl get namespace %TUKI_NAMESPACE% >nul 2>&1
if errorlevel 1 goto :detener_listo

rem Se borran solo los recursos de la app: el namespace y el secreto del
rem gateway se conservan para que el proximo arranque sea mas rapido.
kubectl delete ^
  deployment/tuki deployment/tuki-ai-gateway ^
  service/tuki service/backend ^
  hpa/tuki hpa/tuki-ai-gateway ^
  pdb/tuki pdb/tuki-ai-gateway ^
  --namespace %TUKI_NAMESPACE% --ignore-not-found --wait=false >nul 2>&1

:detener_listo
echo.
echo [OK] Tuki detenido.
echo     Los contenedores y pods ya no estan en marcha.
echo     Se conservan las imagenes locales, el namespace y el secreto.
echo     Para volver a arrancar: iniciar-tuki.bat  o  iniciar-tuki.bat /k8s
ping -n 6 127.0.0.1 >nul
exit /b 0

rem ---------------------------------------------------------------------------
rem  Subrutinas
rem ---------------------------------------------------------------------------
:cerrar_port_forward
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'kubectl.exe' -and $_.CommandLine -like '*port-forward*' -and $_.CommandLine -like '*svc/tuki*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1
exit /b 0

:esperar_docker
set /a _espera=0
:esperar_docker_bucle
docker info >nul 2>&1
if not errorlevel 1 exit /b 0
if %_espera% GEQ %~1 exit /b 1
ping -n 4 127.0.0.1 >nul
set /a _espera+=3
<nul set /p "=."
goto :esperar_docker_bucle

:esperar_k8s
set /a _espera=0
:esperar_k8s_bucle
kubectl get nodes --request-timeout=5s >nul 2>&1
if errorlevel 1 goto :esperar_k8s_reintentar
kubectl wait --for=condition=Ready nodes --all --timeout=1s >nul 2>&1
if not errorlevel 1 exit /b 0
:esperar_k8s_reintentar
if %_espera% GEQ %~1 exit /b 1
ping -n 4 127.0.0.1 >nul
set /a _espera+=3
<nul set /p "=."
goto :esperar_k8s_bucle

:esperar_contenedor
set /a _espera=0
:esperar_contenedor_bucle
set "_salud="
for /f "delims=" %%S in ('docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" %~1 2^>nul') do set "_salud=%%S"
if /i "%_salud%"=="healthy" exit /b 0
if %_espera% GEQ %~2 exit /b 1
ping -n 3 127.0.0.1 >nul
set /a _espera+=2
goto :esperar_contenedor_bucle

:esperar_app
set /a _espera=0
:esperar_app_bucle
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%TUKI_PORT%/healthz' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 exit /b 0
if %_espera% GEQ %~1 exit /b 1
ping -n 3 127.0.0.1 >nul
set /a _espera+=2
goto :esperar_app_bucle

:faltan_variables
echo.
echo [ERROR] Faltan variables obligatorias en .env.local para construir las imagenes:
if not defined VITE_SUPABASE_URL echo         VITE_SUPABASE_URL
if not defined VITE_SUPABASE_ANON_KEY echo         VITE_SUPABASE_ANON_KEY
goto :error

:error
echo.
echo No se pudo completar el arranque de Tuki.
pause
exit /b 1
