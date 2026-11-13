#!/usr/bin/env node
/**
 * Registra el repositorio privado de TukiTuki en Argo CD.
 *
 * El token se lee de `GITHUB_TOKEN` (o `GH_TOKEN`) y se envía a `kubectl` por
 * stdin: nunca se escribe en el repositorio ni en un archivo temporal.
 *
 * Uso:
 *   PowerShell:  $env:GITHUB_TOKEN = "github_pat_..."; pnpm gitops:credenciales
 *   Bash:        GITHUB_TOKEN=github_pat_... pnpm gitops:credenciales
 *
 * El PAT debe tener permiso de lectura sobre el contenido del repositorio.
 * Se aplica con `--server-side` para no dejar el token en la anotación
 * `last-applied-configuration`.
 */

import { spawnSync } from 'node:child_process';

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!token) {
  console.error('Falta GITHUB_TOKEN (o GH_TOKEN) en el entorno.');
  console.error('PowerShell: $env:GITHUB_TOKEN = "github_pat_..."; pnpm gitops:credenciales');
  process.exit(2);
}

const url = process.env.GITOPS_REPO_URL ?? 'https://github.com/lianlee007/Tuki.git';
const usuario = process.env.GITOPS_REPO_USUARIO ?? 'x-access-token';
const nombre = process.env.GITOPS_REPO_SECRETO ?? 'tukituki-repo';

// JSON.stringify produce una cadena YAML válida entre comillas dobles y escapa
// cualquier carácter especial del token.
const manifiesto = `apiVersion: v1
kind: Secret
metadata:
  name: ${nombre}
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
type: Opaque
stringData:
  type: git
  url: ${url}
  username: ${usuario}
  password: ${JSON.stringify(token)}
`;

const resultado = spawnSync('kubectl', ['apply', '--server-side', '-f', '-'], {
  input: manifiesto,
  encoding: 'utf8',
  stdio: ['pipe', 'inherit', 'inherit'],
});

if (resultado.error) {
  console.error(`No se pudo ejecutar kubectl: ${resultado.error.message}`);
  process.exit(1);
}

if (resultado.status !== 0) {
  process.exit(resultado.status ?? 1);
}

console.log(`Repositorio registrado en Argo CD como secreto "${nombre}".`);
console.log('Argo CD reintentará la sincronización en el próximo ciclo.');
