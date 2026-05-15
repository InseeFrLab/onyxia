terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  labels = {
    app       = "onyxia"
    example   = "gke-ephemeral"
    lifecycle = "durable"
  }

  bootstrap_services = [
    "cloudresourcemanager.googleapis.com"
  ]

  required_services = [
    "compute.googleapis.com",
    "container.googleapis.com",
    "storage.googleapis.com"
  ]
}

resource "google_project_service" "bootstrap" {
  for_each = toset(local.bootstrap_services)

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}

resource "google_project_service" "required" {
  for_each = toset(local.required_services)

  project = var.project_id
  service = each.value

  disable_on_destroy = false

  depends_on = [google_project_service.bootstrap]
}

resource "google_storage_bucket" "backup" {
  name                        = var.backup_bucket_name
  project                     = var.project_id
  location                    = var.bucket_location
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = false
  labels                      = local.labels

  depends_on = [google_project_service.required]
}
