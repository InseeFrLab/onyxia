output "cluster_name" {
  value       = google_container_cluster.onyxia.name
  description = "Disposable GKE cluster name."
}

output "region" {
  value       = var.region
  description = "GKE region."
}

output "get_credentials_command" {
  value = join(" ", [
    "gcloud container clusters get-credentials",
    google_container_cluster.onyxia.name,
    "--project",
    var.project_id,
    "--location",
    var.region
  ])
  description = "Command used to configure kubectl for the disposable cluster."
}

