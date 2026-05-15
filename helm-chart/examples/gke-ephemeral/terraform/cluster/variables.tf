variable "project_id" {
  type        = string
  description = "Google Cloud project ID."
}

variable "region" {
  type        = string
  description = "GKE Autopilot region."
  default     = "us-central1"
}

variable "cluster_name" {
  type        = string
  description = "Disposable GKE cluster name."
  default     = "onyxia-test"
}

variable "network_name" {
  type        = string
  description = "Disposable VPC network name."
  default     = "onyxia-test"
}

variable "subnetwork_name" {
  type        = string
  description = "Disposable VPC subnetwork name."
  default     = "onyxia-test"
}

variable "subnetwork_cidr" {
  type        = string
  description = "Primary CIDR range for the disposable GKE subnetwork."
  default     = "10.10.0.0/20"
}

variable "pods_cidr" {
  type        = string
  description = "Secondary CIDR range for GKE Pods."
  default     = "10.20.0.0/16"
}

variable "services_cidr" {
  type        = string
  description = "Secondary CIDR range for Kubernetes Services."
  default     = "10.30.0.0/20"
}
