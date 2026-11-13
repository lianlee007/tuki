provider "kubernetes" {
  config_path    = var.kubeconfig_path != null ? var.kubeconfig_path : pathexpand("~/.kube/config")
  config_context = var.kube_context
}

# GitHub no declara bloque `provider`: cuando manage_github=true se configura
# con las variables de entorno GITHUB_OWNER y GITHUB_TOKEN. Con el valor por
# defecto (false) los recursos tienen count=0 y no se hace ninguna llamada a la
# API, lo que permite planificar en local sin credenciales.
