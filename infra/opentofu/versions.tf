terraform {
  required_version = ">= 1.8.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 3.5"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.13"
    }
  }

  # Backend local por defecto: el estado queda en infra/opentofu/terraform.tfstate
  # (ignorado por Git). Para trabajo en equipo se descomenta un backend remoto:
  #
  # backend "s3" {
  #   bucket = "tukituki-tofu"
  #   key    = "plataforma/terraform.tfstate"
  #   region = "us-east-1"
  #   endpoints = { s3 = "http://rustfs:9000" }
  #   skip_credentials_validation = true
  #   skip_region_validation      = true
  #   skip_requesting_account_id  = true
  #   use_path_style              = true
  # }
}
