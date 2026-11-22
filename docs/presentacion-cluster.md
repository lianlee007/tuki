# Sustentación en el clúster local

Todo el proyecto (6 servicios, 3 frontends, Postgres, Redis, RustFS y el
gateway de IA local) se ejecuta en el clúster de Docker Desktop y Argo CD lo
mantiene sincronizado desde `main`.

## Antes de presentar

1. Docker Desktop encendido y Kubernetes habilitado.
2. Ollama encendido y escuchando en toda la máquina (la IA es local):

   ```powershell
   Stop-Process -Name "ollama app","ollama" -ErrorAction SilentlyContinue
   $env:OLLAMA_HOST = '0.0.0.0:11434'
   Start-Process "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" -ArgumentList "serve" -WindowStyle Hidden
   ```

3. Argo CD accesible:

   ```powershell
   Start-Process cmd.exe -ArgumentList '/c','kubectl -n argocd port-forward svc/argocd-server 8081:443'
   ```

   Abrir <https://localhost:8081>. Usuario `admin`; la contraseña está en:

   ```powershell
   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" |
     ForEach-Object { [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_)) }
   ```

4. Agregar una vez al archivo `C:\Windows\System32\drivers\etc\hosts` (como
   administrador):

   ```
   127.0.0.1 tukituki.example.com panel.tukituki.example.com admin.tukituki.example.com api.tukituki.example.com
   ```

## Abrir la aplicación

- Público: <https://tukituki.example.com>
- Panel: <https://panel.tukituki.example.com>
- Admin: <https://admin.tukituki.example.com>
- API: <https://api.tukituki.example.com>

El certificado es autofirmado: aceptar la advertencia del navegador.

## Verificar antes de entrar

```powershell
kubectl -n argocd get application tukituki-local   # Synced / Healthy
kubectl -n tukituki get pods                       # todos 1/1
```

Prueba de la IA local (Ollama + catálogo real):

```powershell
curl.exe -k -H "Host: api.tukituki.example.com" `
  -H "Content-Type: application/json" `
  -d '{\"mensaje\":\"que me recomiendas para almorzar\"}' `
  https://localhost/api/v1/ai/recomendar
```

## Notas importantes

- Las imágenes del rediseño y del gateway de IA se cargaron en el containerd
  del nodo. Si se reinicia Docker Desktop sin borrar el clúster, se conservan.
  Si se **resetea** Kubernetes, hay que volver a cargarlas o publicarlas en
  GHCR con un token que tenga `write:packages`.
- La observabilidad (Grafana, Prometheus, Tempo, OTel) está apagada para
  liberar memoria. No es necesaria para la demo.
- Los datos de demo (49 reseñas, sin fotos) están aplicados en la base del
  clúster.
- Los servidores de desarrollo locales (`pnpm dev:*`) no son necesarios para
  la demo; se pueden cerrar para liberar memoria.
