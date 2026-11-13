variable "kubeconfig_path" {
  description = "Ruta al kubeconfig. Null usa el valor por defecto del provider (~/.kube/config)."
  type        = string
  default     = null
}

variable "kube_context" {
  description = "Contexto de Kubernetes donde se gestionan los recursos base."
  type        = string
  default     = "docker-desktop"
}

variable "namespace" {
  description = "Namespace de la plataforma TukiTuki."
  type        = string
  default     = "tukituki"
}

variable "create_namespace" {
  description = "Si true, OpenTofu crea el namespace; si false, lo adopta con un data source (clúster existente)."
  type        = bool
  default     = true
}

variable "environment" {
  description = "Etiqueta de ambiente (local, staging, production)."
  type        = string
  default     = "local"
}

variable "resource_quota" {
  description = "Techos agregados del namespace. Son límites máximos, no reservas."
  type = object({
    requests_cpu    = string
    requests_memory = string
    limits_cpu      = string
    limits_memory   = string
    pods            = string
  })
  default = {
    requests_cpu    = "8"
    requests_memory = "12Gi"
    limits_cpu      = "16"
    limits_memory   = "24Gi"
    pods            = "40"
  }
}

variable "limit_range" {
  description = "Valores por defecto y máximos para contenedores del namespace."
  type = object({
    default_cpu            = string
    default_memory         = string
    default_request_cpu    = string
    default_request_memory = string
    max_cpu                = string
    max_memory             = string
  })
  default = {
    default_cpu            = "500m"
    default_memory         = "512Mi"
    default_request_cpu    = "100m"
    default_request_memory = "128Mi"
    max_cpu                = "2"
    max_memory             = "4Gi"
  }
}

variable "manage_github" {
  description = "Si true, gestiona branch protection y alertas del repositorio."
  type        = bool
  default     = false
}

variable "github_owner" {
  description = "Propietario del repositorio (documental; el provider lee GITHUB_OWNER)."
  type        = string
  default     = ""
}

variable "github_repository" {
  description = "Nombre del repositorio en GitHub."
  type        = string
  default     = "Tuki"
}

variable "github_token" {
  description = "PAT con permisos de administración (documental; usar GITHUB_TOKEN)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "github_required_checks" {
  description = "Checks obligatorios antes de fusionar a main."
  type        = list(string)
  default = [
    "Tipos, pruebas y build",
    "E2E de los tres frontends",
    "AI Gateway (FastAPI)",
    "Kustomize de local y producción",
    "Escaneo del repositorio"
  ]
}
