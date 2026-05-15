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

variable "namespace" {
  type        = string
  description = "Kubernetes namespace for the Onyxia Helm release."
  default     = "onyxia"
}

variable "release_name" {
  type        = string
  description = "Helm release name."
  default     = "onyxia"
}

variable "chart_repository" {
  type        = string
  description = "Onyxia Helm chart repository."
  default     = "https://inseefrlab.github.io/onyxia"
}

variable "chart_name" {
  type        = string
  description = "Onyxia Helm chart name."
  default     = "onyxia"
}

variable "chart_version" {
  type        = string
  description = "Onyxia Helm chart version."
  default     = "10.33.0"
}

variable "values_file" {
  type        = string
  description = "Path to the Onyxia Helm values file."
  default     = "../../onyxia-values.yaml"
}

variable "extra_values_files" {
  type        = list(string)
  description = "Additional Helm values files, applied after values_file. Use ignored local files for deployment-specific OAuth client IDs or hostnames."
  default     = []
}

variable "helm_timeout_seconds" {
  type        = number
  description = "Timeout for the Onyxia Helm release."
  default     = 600
}

variable "create_gke_public_ingress_support" {
  type        = bool
  description = "Create GKE-specific public Ingress support resources: a global static IP and a ManagedCertificate."
  default     = false
}

variable "public_hostname" {
  type        = string
  description = "Public hostname served by the optional GKE ManagedCertificate."
  default     = ""

  validation {
    condition     = !var.create_gke_public_ingress_support || var.public_hostname != ""
    error_message = "public_hostname must be set when create_gke_public_ingress_support is true."
  }
}

variable "ingress_static_ip_name" {
  type        = string
  description = "Name of the optional global static IP used by the GKE Ingress."
  default     = "onyxia-test-ip"
}

variable "managed_certificate_name" {
  type        = string
  description = "Name of the optional GKE ManagedCertificate referenced by the Ingress annotations."
  default     = "onyxia-cert"
}

variable "enable_oauth2_proxy_gateway" {
  type        = bool
  description = "Deploy an optional oauth2-proxy and NGINX gateway in front of Onyxia for Google OAuth on GKE."
  default     = false
}

variable "oauth2_proxy_client_id" {
  type        = string
  description = "Google OAuth client ID used by the optional oauth2-proxy gateway. The client secret must be provided via an existing Kubernetes Secret."
  default     = ""
}

variable "oauth2_proxy_allowed_emails" {
  type        = list(string)
  description = "Google account email addresses allowed through the optional oauth2-proxy gateway."
  default     = []
}

variable "oauth2_proxy_secret_name" {
  type        = string
  description = "Name of the existing Kubernetes Secret containing client-secret and cookie-secret keys for oauth2-proxy."
  default     = "onyxia-oauth2-proxy"
}

variable "oauth2_proxy_cookie_domain" {
  type        = string
  description = "Optional cookie domain for oauth2-proxy. Use a parent domain such as .example.com when protecting service subdomains."
  default     = ""
}

variable "oauth2_proxy_whitelist_domains" {
  type        = list(string)
  description = "Optional redirect whitelist domains for oauth2-proxy, for example .example.com when service subdomains redirect through the same OAuth gateway."
  default     = []
}

variable "oauth2_proxy_image" {
  type        = string
  description = "Container image used for oauth2-proxy."
  default     = "quay.io/oauth2-proxy/oauth2-proxy:v7.8.1"
}

variable "auth_gateway_nginx_image" {
  type        = string
  description = "Container image used for the optional NGINX auth gateway."
  default     = "nginx:1.27-alpine"
}

variable "enable_services_ingress_nginx" {
  type        = bool
  description = "Deploy an optional ingress-nginx controller for Onyxia user services to avoid creating one GCE Load Balancer per service Ingress."
  default     = false
}

variable "services_ingress_class_name" {
  type        = string
  description = "IngressClass name used by Onyxia user services when the optional ingress-nginx controller is enabled."
  default     = "nginx"
}

variable "services_ingress_nginx_namespace" {
  type        = string
  description = "Namespace for the optional ingress-nginx controller used by Onyxia user services."
  default     = "ingress-nginx"
}

variable "services_ingress_nginx_release_name" {
  type        = string
  description = "Helm release name for the optional ingress-nginx controller used by Onyxia user services."
  default     = "ingress-nginx"
}

variable "services_ingress_nginx_chart_version" {
  type        = string
  description = "ingress-nginx Helm chart version."
  default     = "4.12.1"
}

variable "services_ingress_nginx_oauth2_auth" {
  type        = bool
  description = "Configure ingress-nginx global auth against the optional oauth2-proxy gateway for service subdomains."
  default     = true
}

variable "services_ingress_nginx_controller_service_annotations" {
  type        = map(string)
  description = "Optional annotations for the ingress-nginx controller LoadBalancer Service."
  default     = {}
}

variable "enable_cert_manager" {
  type        = bool
  description = "Deploy cert-manager and a Let's Encrypt ClusterIssuer for Onyxia user service TLS."
  default     = false
}

variable "cert_manager_namespace" {
  type        = string
  description = "Namespace for cert-manager."
  default     = "cert-manager"
}

variable "cert_manager_release_name" {
  type        = string
  description = "Helm release name for cert-manager."
  default     = "cert-manager"
}

variable "cert_manager_chart_version" {
  type        = string
  description = "cert-manager Helm chart version."
  default     = "v1.16.3"
}

variable "cert_manager_cluster_issuer_name" {
  type        = string
  description = "ClusterIssuer name used by Onyxia user service Ingresses."
  default     = "letsencrypt-prod"
}

variable "cert_manager_acme_server" {
  type        = string
  description = "ACME directory URL used by cert-manager."
  default     = "https://acme-v02.api.letsencrypt.org/directory"
}

variable "cert_manager_letsencrypt_email" {
  type        = string
  description = "Email address registered with Let's Encrypt. Required when enable_cert_manager is true."
  default     = ""

  validation {
    condition     = !var.enable_cert_manager || var.cert_manager_letsencrypt_email != ""
    error_message = "cert_manager_letsencrypt_email must be set when enable_cert_manager is true."
  }
}

variable "local_port" {
  type        = number
  description = "Local port used by the local same-origin proxy output."
  default     = 18080
}

variable "local_web_port" {
  type        = number
  description = "Local port used by the web service port-forward output."
  default     = 18082
}

variable "local_api_port" {
  type        = number
  description = "Local port used by the API service port-forward output."
  default     = 18083
}
