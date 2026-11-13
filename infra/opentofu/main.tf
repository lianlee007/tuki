# Prerrequisitos de plataforma que no pertenecen al despliegue de la app.
#
# El namespace, la cuota y el LimitRange son la base sobre la que Argo CD
# sincroniza los manifiestos de infra/k8s. No se duplican Deployments ni
# Services: esos los gestiona GitOps.

resource "kubernetes_namespace_v1" "tukituki" {
  count = var.create_namespace ? 1 : 0

  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/part-of" = "tukituki"
      "tukituki.io/environment"   = var.environment
    }
  }
}

# En un clúster existente el namespace ya lo creó Argo CD/Kustomize. Se lee con
# un data source para no pelear por sus labels ni por los recursos internos.
data "kubernetes_namespace_v1" "tukituki" {
  count = var.create_namespace ? 0 : 1

  metadata {
    name = var.namespace
  }
}

locals {
  namespace = var.create_namespace ? kubernetes_namespace_v1.tukituki[0].metadata[0].name : data.kubernetes_namespace_v1.tukituki[0].metadata[0].name
}

resource "kubernetes_resource_quota_v1" "tukituki" {
  metadata {
    name      = "tukituki-cuota"
    namespace = local.namespace
    labels = {
      "app.kubernetes.io/part-of" = "tukituki"
    }
  }

  spec {
    hard = {
      "requests.cpu"    = var.resource_quota.requests_cpu
      "requests.memory" = var.resource_quota.requests_memory
      "limits.cpu"      = var.resource_quota.limits_cpu
      "limits.memory"   = var.resource_quota.limits_memory
      "pods"            = var.resource_quota.pods
    }
  }
}

resource "kubernetes_limit_range_v1" "tukituki" {
  metadata {
    name      = "tukituki-limites"
    namespace = local.namespace
    labels = {
      "app.kubernetes.io/part-of" = "tukituki"
    }
  }

  spec {
    limit {
      type = "Container"
      default = {
        cpu    = var.limit_range.default_cpu
        memory = var.limit_range.default_memory
      }
      default_request = {
        cpu    = var.limit_range.default_request_cpu
        memory = var.limit_range.default_request_memory
      }
      max = {
        cpu    = var.limit_range.max_cpu
        memory = var.limit_range.max_memory
      }
    }
  }
}
