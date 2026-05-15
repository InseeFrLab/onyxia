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
    lifecycle = "disposable"
  }
}

resource "google_compute_network" "onyxia" {
  name                    = var.network_name
  project                 = var.project_id
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "onyxia" {
  name          = var.subnetwork_name
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.onyxia.id
  ip_cidr_range = var.subnetwork_cidr

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.services_cidr
  }
}

resource "google_container_cluster" "onyxia" {
  name             = var.cluster_name
  project          = var.project_id
  location         = var.region
  enable_autopilot = true
  network          = google_compute_network.onyxia.id
  subnetwork       = google_compute_subnetwork.onyxia.id

  deletion_protection = false

  release_channel {
    channel = "REGULAR"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  resource_labels = local.labels
}
