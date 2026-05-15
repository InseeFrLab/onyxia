variable "project_id" {
  type        = string
  description = "Google Cloud project ID."
}

variable "region" {
  type        = string
  description = "Default Google Cloud region used by this example."
  default     = "us-central1"
}

variable "bucket_location" {
  type        = string
  description = "Cloud Storage bucket location. Use an uppercase GCS location such as US-CENTRAL1."
  default     = "US-CENTRAL1"
}

variable "backup_bucket_name" {
  type        = string
  description = "Globally unique Cloud Storage bucket name kept while the cluster is deleted."
}
