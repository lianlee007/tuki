package main

# Políticas mínimas de Tuki para Deployments. Se ejecutan con:
#   conftest test -p deploy/policies <manifiesto.yaml>
#
# No sustituyen a Pod Security Standards ni a kube-linter: cubren las
# decisiones propias del proyecto (rootfs, capabilities, recursos, etc.).

has_all_capabilities_dropped(container) {
  container.securityContext.capabilities.drop[_] == "ALL"
}

deny[msg] {
  input.kind == "Deployment"
  not input.spec.template.spec.securityContext.runAsNonRoot == true
  msg := sprintf("%s/%s: el pod debe declarar securityContext.runAsNonRoot=true", [input.kind, input.metadata.name])
}

deny[msg] {
  input.kind == "Deployment"
  not input.spec.template.spec.automountServiceAccountToken == false
  msg := sprintf("%s/%s: automountServiceAccountToken debe ser false", [input.kind, input.metadata.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.securityContext.readOnlyRootFilesystem == true
  msg := sprintf("%s/%s: el contenedor %s debe usar readOnlyRootFilesystem=true", [input.kind, input.metadata.name, container.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.securityContext.allowPrivilegeEscalation == false
  msg := sprintf("%s/%s: el contenedor %s debe usar allowPrivilegeEscalation=false", [input.kind, input.metadata.name, container.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not has_all_capabilities_dropped(container)
  msg := sprintf("%s/%s: el contenedor %s debe eliminar todas las capabilities (drop: [ALL])", [input.kind, input.metadata.name, container.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  container.securityContext.runAsUser == 0
  msg := sprintf("%s/%s: el contenedor %s no puede ejecutarse como UID 0", [input.kind, input.metadata.name, container.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.cpu
  msg := sprintf("%s/%s: el contenedor %s necesita limits.cpu", [input.kind, input.metadata.name, container.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.memory
  msg := sprintf("%s/%s: el contenedor %s necesita limits.memory", [input.kind, input.metadata.name, container.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  endswith(container.image, ":latest")
  msg := sprintf("%s/%s: el contenedor %s no puede usar la etiqueta latest", [input.kind, input.metadata.name, container.name])
}
