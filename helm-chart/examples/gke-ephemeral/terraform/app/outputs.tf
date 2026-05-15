output "web_port_forward_command" {
  value       = "kubectl -n ${var.namespace} port-forward --address 127.0.0.1 svc/${var.release_name}-web ${var.local_web_port}:80"
  description = "Command used to forward the Onyxia web service locally."
}

output "api_port_forward_command" {
  value       = "kubectl -n ${var.namespace} port-forward --address 127.0.0.1 svc/${var.release_name}-api ${var.local_api_port}:80"
  description = "Command used to forward the Onyxia API service locally."
}

output "local_proxy_command" {
  value       = "ONYXIA_PROXY_PORT=${var.local_port} ONYXIA_WEB_PORT=${var.local_web_port} ONYXIA_API_PORT=${var.local_api_port} node ../../scripts/onyxia-local-proxy.mjs"
  description = "Command used from terraform/app to open Onyxia locally with the same /api routing shape as Ingress or HTTPRoute."
}

output "local_url" {
  value       = "http://127.0.0.1:${var.local_port}"
  description = "Local URL after starting both port-forwards and the local proxy."
}

output "gke_ingress_static_ip" {
  value       = var.create_gke_public_ingress_support ? google_compute_global_address.ingress[0].address : null
  description = "Global static IP to point the public DNS record at when GKE public Ingress support is enabled."
}

data "kubernetes_service" "services_ingress_nginx_controller" {
  count = var.enable_services_ingress_nginx ? 1 : 0

  metadata {
    name      = "${var.services_ingress_nginx_release_name}-controller"
    namespace = var.services_ingress_nginx_namespace
  }

  depends_on = [helm_release.services_ingress_nginx]
}

output "services_ingress_nginx_ip" {
  value       = var.enable_services_ingress_nginx ? try(data.kubernetes_service.services_ingress_nginx_controller[0].status[0].load_balancer[0].ingress[0].ip, null) : null
  description = "External IP of the optional ingress-nginx controller used by Onyxia user services. Point *.services.<domain> at this IP."
}
