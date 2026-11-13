# Gobernanza del repositorio: los checks de CI deben pasar antes de fusionar.
#
# Se activa con manage_github=true y las variables de entorno GITHUB_OWNER y
# GITHUB_TOKEN (PAT con permisos de administración). En local count=0 y no se
# hace ninguna llamada a la API.

resource "github_branch_protection_v3" "main" {
  count = var.manage_github ? 1 : 0

  repository     = var.github_repository
  branch         = "main"
  enforce_admins = false

  required_status_checks {
    strict   = true
    contexts = var.github_required_checks
  }

  require_conversation_resolution = true
  require_signed_commits          = false
}

resource "github_repository_vulnerability_alerts" "repo" {
  count = var.manage_github ? 1 : 0

  repository = var.github_repository
}
