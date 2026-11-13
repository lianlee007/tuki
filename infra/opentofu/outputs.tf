output "namespace" {
  description = "Namespace gestionado o adoptado por OpenTofu."
  value       = local.namespace
}

output "resource_quota" {
  description = "Nombre de la ResourceQuota."
  value       = kubernetes_resource_quota_v1.tukituki.metadata[0].name
}

output "limit_range" {
  description = "Nombre del LimitRange."
  value       = kubernetes_limit_range_v1.tukituki.metadata[0].name
}

output "github_gobernanza" {
  description = "Indica si la protección de main está activa."
  value       = var.manage_github ? "activa" : "desactivada"
}
