output "backup_bucket_name" {
  value       = google_storage_bucket.backup.name
  description = "Bucket kept across hibernation cycles."
}

output "backup_bucket_url" {
  value       = google_storage_bucket.backup.url
  description = "Google Cloud Storage URL for the hibernation backup bucket."
}

output "region" {
  value       = var.region
  description = "Region used by this example."
}

