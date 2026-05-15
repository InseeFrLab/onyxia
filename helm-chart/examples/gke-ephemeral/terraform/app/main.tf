terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "current" {}

data "google_container_cluster" "onyxia" {
  name     = var.cluster_name
  project  = var.project_id
  location = var.region
}

provider "kubernetes" {
  host                   = "https://${data.google_container_cluster.onyxia.endpoint}"
  token                  = data.google_client_config.current.access_token
  cluster_ca_certificate = base64decode(data.google_container_cluster.onyxia.master_auth[0].cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = "https://${data.google_container_cluster.onyxia.endpoint}"
    token                  = data.google_client_config.current.access_token
    cluster_ca_certificate = base64decode(data.google_container_cluster.onyxia.master_auth[0].cluster_ca_certificate)
  }
}

locals {
  auth_gateway_name                = "${var.release_name}-auth-gateway"
  oauth2_proxy_name                = "${var.release_name}-oauth2-proxy"
  oauth2_proxy_allowed_emails_file = join("\n", concat(var.oauth2_proxy_allowed_emails, [""]))
  oauth2_proxy_cookie_domain_args  = var.oauth2_proxy_cookie_domain == "" ? [] : ["--cookie-domain=${var.oauth2_proxy_cookie_domain}"]
  oauth2_proxy_whitelist_domain_args = [
    for domain in var.oauth2_proxy_whitelist_domains : "--whitelist-domain=${domain}"
  ]
  oauth2_proxy_redirect_url = "https://${var.public_hostname}/oauth2/callback"
  services_ingress_nginx_controller_config = merge(
    {
      "force-ssl-redirect"        = "true"
      "no-tls-redirect-locations" = "/.well-known/acme-challenge"
      "ssl-redirect"              = "true"
      "use-forwarded-headers"     = "true"
    },
    var.services_ingress_nginx_oauth2_auth ? {
      "global-auth-response-headers" = "X-Auth-Request-User,X-Auth-Request-Email"
      "global-auth-signin"           = "https://${var.public_hostname}/oauth2/start?rd=https://$best_http_host$escaped_request_uri"
      "global-auth-url"              = "http://${local.oauth2_proxy_name}.${var.namespace}.svc.cluster.local/oauth2/auth"
    } : {}
  )

  auth_gateway_nginx_config = <<-EOT
    server {
      listen 8080;
      server_name _;
      server_tokens off;

      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto https;
      proxy_set_header X-Forwarded-Host $host;
      proxy_set_header X-Forwarded-Uri $request_uri;

      location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "ok\n";
      }

      location /oauth2/ {
        proxy_pass http://${local.oauth2_proxy_name}.${var.namespace}.svc.cluster.local:80;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Uri $request_uri;
      }

      location = /oauth2/auth {
        internal;
        proxy_pass http://${local.oauth2_proxy_name}.${var.namespace}.svc.cluster.local:80/oauth2/auth;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
      }

      location @oauth2_signin {
        return 302 https://$host/oauth2/start?rd=https://$host$request_uri;
      }

      location /api {
        auth_request /oauth2/auth;
        error_page 401 = @oauth2_signin;
        auth_request_set $auth_user $upstream_http_x_auth_request_user;
        auth_request_set $auth_email $upstream_http_x_auth_request_email;
        proxy_set_header X-Forwarded-User $auth_user;
        proxy_set_header X-Forwarded-Email $auth_email;
        proxy_pass http://${var.release_name}-api.${var.namespace}.svc.cluster.local:80;
      }

      location / {
        auth_request /oauth2/auth;
        error_page 401 = @oauth2_signin;
        auth_request_set $auth_user $upstream_http_x_auth_request_user;
        auth_request_set $auth_email $upstream_http_x_auth_request_email;
        proxy_set_header X-Forwarded-User $auth_user;
        proxy_set_header X-Forwarded-Email $auth_email;
        proxy_pass http://${var.release_name}-web.${var.namespace}.svc.cluster.local:80;
      }
    }
  EOT
}

resource "kubernetes_namespace" "onyxia" {
  metadata {
    name = var.namespace

    labels = {
      app     = "onyxia"
      example = "gke-ephemeral"
    }
  }
}

resource "google_compute_global_address" "ingress" {
  count = var.create_gke_public_ingress_support ? 1 : 0

  name         = var.ingress_static_ip_name
  address_type = "EXTERNAL"
}

resource "kubernetes_manifest" "managed_certificate" {
  count = var.create_gke_public_ingress_support ? 1 : 0

  manifest = {
    apiVersion = "networking.gke.io/v1"
    kind       = "ManagedCertificate"
    metadata = {
      name      = var.managed_certificate_name
      namespace = kubernetes_namespace.onyxia.metadata[0].name
    }
    spec = {
      domains = [var.public_hostname]
    }
  }
}

resource "kubernetes_namespace" "services_ingress_nginx" {
  count = var.enable_services_ingress_nginx ? 1 : 0

  metadata {
    name = var.services_ingress_nginx_namespace

    labels = {
      app       = "onyxia"
      component = "services-ingress-nginx"
      example   = "gke-ephemeral"
    }
  }
}

resource "helm_release" "services_ingress_nginx" {
  count = var.enable_services_ingress_nginx ? 1 : 0

  name       = var.services_ingress_nginx_release_name
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  version    = var.services_ingress_nginx_chart_version
  namespace  = kubernetes_namespace.services_ingress_nginx[0].metadata[0].name

  values = [
    yamlencode({
      controller = {
        ingressClass = var.services_ingress_class_name
        ingressClassResource = {
          controllerValue = "k8s.io/ingress-nginx"
          default         = false
          enabled         = true
          name            = var.services_ingress_class_name
        }
        replicaCount = 1
        config       = local.services_ingress_nginx_controller_config
        service = {
          type        = "LoadBalancer"
          annotations = var.services_ingress_nginx_controller_service_annotations
        }
        resources = {
          requests = {
            cpu    = "100m"
            memory = "128Mi"
          }
          limits = {
            memory = "256Mi"
          }
        }
      }
    })
  ]

  wait    = true
  timeout = var.helm_timeout_seconds
}

resource "kubernetes_namespace" "cert_manager" {
  count = var.enable_cert_manager ? 1 : 0

  metadata {
    name = var.cert_manager_namespace

    labels = {
      app       = "onyxia"
      component = "cert-manager"
      example   = "gke-ephemeral"
    }
  }
}

resource "helm_release" "cert_manager" {
  count = var.enable_cert_manager ? 1 : 0

  name       = var.cert_manager_release_name
  repository = "https://charts.jetstack.io"
  chart      = "cert-manager"
  version    = var.cert_manager_chart_version
  namespace  = kubernetes_namespace.cert_manager[0].metadata[0].name

  set {
    name  = "crds.enabled"
    value = "true"
  }

  set {
    name  = "startupapicheck.enabled"
    value = "false"
  }

  # GKE Autopilot blocks writes to the kube-system namespace, including the
  # default leader-election leases used by cert-manager. Pin leader election
  # to the cert-manager namespace so cainjector/controller can start.
  set {
    name  = "global.leaderElection.namespace"
    value = var.cert_manager_namespace
  }

  wait    = true
  timeout = var.helm_timeout_seconds
}

resource "kubernetes_manifest" "cert_manager_cluster_issuer" {
  count = var.enable_cert_manager && var.cert_manager_letsencrypt_email != "" ? 1 : 0

  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "ClusterIssuer"
    metadata = {
      name = var.cert_manager_cluster_issuer_name
    }
    spec = {
      acme = {
        email  = var.cert_manager_letsencrypt_email
        server = var.cert_manager_acme_server
        privateKeySecretRef = {
          name = "${var.cert_manager_cluster_issuer_name}-account-key"
        }
        solvers = [
          {
            http01 = {
              ingress = {
                class = var.services_ingress_class_name
              }
            }
          }
        ]
      }
    }
  }

  depends_on = [helm_release.cert_manager, helm_release.services_ingress_nginx]
}

resource "helm_release" "onyxia" {
  name       = var.release_name
  repository = var.chart_repository
  chart      = var.chart_name
  version    = var.chart_version
  namespace  = kubernetes_namespace.onyxia.metadata[0].name

  values = [for values_file in concat([var.values_file], var.extra_values_files) : file(values_file)]

  wait    = true
  timeout = var.helm_timeout_seconds
  depends_on = [
    google_compute_global_address.ingress,
    kubernetes_manifest.managed_certificate,
    kubernetes_manifest.cert_manager_cluster_issuer,
    helm_release.services_ingress_nginx
  ]
}

resource "kubernetes_config_map" "oauth2_proxy_allowed_emails" {
  count = var.enable_oauth2_proxy_gateway ? 1 : 0

  metadata {
    name      = "${local.oauth2_proxy_name}-allowed-emails"
    namespace = kubernetes_namespace.onyxia.metadata[0].name

    labels = {
      "app.kubernetes.io/name"      = local.oauth2_proxy_name
      "app.kubernetes.io/component" = "auth"
      "app.kubernetes.io/part-of"   = var.release_name
    }
  }

  data = {
    "allowed-emails" = local.oauth2_proxy_allowed_emails_file
  }
}

resource "kubernetes_manifest" "oauth2_proxy_deployment" {
  count = var.enable_oauth2_proxy_gateway ? 1 : 0

  manifest = {
    apiVersion = "apps/v1"
    kind       = "Deployment"
    metadata = {
      name      = local.oauth2_proxy_name
      namespace = kubernetes_namespace.onyxia.metadata[0].name
      labels = {
        "app.kubernetes.io/name"      = local.oauth2_proxy_name
        "app.kubernetes.io/component" = "auth"
        "app.kubernetes.io/part-of"   = var.release_name
      }
    }
    spec = {
      replicas = 1
      selector = {
        matchLabels = {
          "app.kubernetes.io/name" = local.oauth2_proxy_name
        }
      }
      template = {
        metadata = {
          labels = {
            "app.kubernetes.io/name"      = local.oauth2_proxy_name
            "app.kubernetes.io/component" = "auth"
            "app.kubernetes.io/part-of"   = var.release_name
          }
        }
        spec = {
          containers = [
            {
              name  = "oauth2-proxy"
              image = var.oauth2_proxy_image
              args = concat(
                [
                  "--provider=google",
                  "--http-address=0.0.0.0:4180",
                  "--redirect-url=${local.oauth2_proxy_redirect_url}",
                  "--scope=openid email profile",
                  "--email-domain=*",
                  "--authenticated-emails-file=/etc/oauth2-proxy/allowed-emails",
                  "--cookie-secure=true",
                  "--cookie-httponly=true",
                  "--cookie-samesite=lax",
                  "--cookie-refresh=1h",
                  "--cookie-expire=8h",
                  "--set-xauthrequest=true",
                  "--pass-access-token=false",
                  "--pass-authorization-header=false",
                  "--reverse-proxy=true",
                  "--skip-provider-button=true"
                ],
                local.oauth2_proxy_cookie_domain_args,
                local.oauth2_proxy_whitelist_domain_args,
                ["--upstream=static://202"]
              )
              env = [
                {
                  name  = "OAUTH2_PROXY_CLIENT_ID"
                  value = var.oauth2_proxy_client_id
                },
                {
                  name = "OAUTH2_PROXY_CLIENT_SECRET"
                  valueFrom = {
                    secretKeyRef = {
                      name = var.oauth2_proxy_secret_name
                      key  = "client-secret"
                    }
                  }
                },
                {
                  name = "OAUTH2_PROXY_COOKIE_SECRET"
                  valueFrom = {
                    secretKeyRef = {
                      name = var.oauth2_proxy_secret_name
                      key  = "cookie-secret"
                    }
                  }
                }
              ]
              ports = [
                {
                  name          = "http"
                  containerPort = 4180
                }
              ]
              readinessProbe = {
                httpGet = {
                  path = "/ping"
                  port = "http"
                }
              }
              livenessProbe = {
                httpGet = {
                  path = "/ping"
                  port = "http"
                }
              }
              resources = {
                requests = {
                  cpu                 = "50m"
                  memory              = "64Mi"
                  "ephemeral-storage" = "64Mi"
                }
                limits = {
                  memory              = "128Mi"
                  "ephemeral-storage" = "64Mi"
                }
              }
              volumeMounts = [
                {
                  name      = "allowed-emails"
                  mountPath = "/etc/oauth2-proxy"
                  readOnly  = true
                }
              ]
            }
          ]
          volumes = [
            {
              name = "allowed-emails"
              configMap = {
                name = kubernetes_config_map.oauth2_proxy_allowed_emails[0].metadata[0].name
                items = [
                  {
                    key  = "allowed-emails"
                    path = "allowed-emails"
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }

  depends_on = [helm_release.onyxia]
}

resource "kubernetes_manifest" "oauth2_proxy_service" {
  count = var.enable_oauth2_proxy_gateway ? 1 : 0

  manifest = {
    apiVersion = "v1"
    kind       = "Service"
    metadata = {
      name      = local.oauth2_proxy_name
      namespace = kubernetes_namespace.onyxia.metadata[0].name
      labels = {
        "app.kubernetes.io/name"      = local.oauth2_proxy_name
        "app.kubernetes.io/component" = "auth"
        "app.kubernetes.io/part-of"   = var.release_name
      }
    }
    spec = {
      type = "ClusterIP"
      selector = {
        "app.kubernetes.io/name" = local.oauth2_proxy_name
      }
      ports = [
        {
          name       = "http"
          port       = 80
          targetPort = "http"
        }
      ]
    }
  }

  depends_on = [kubernetes_manifest.oauth2_proxy_deployment]
}

resource "kubernetes_config_map" "auth_gateway_nginx" {
  count = var.enable_oauth2_proxy_gateway ? 1 : 0

  metadata {
    name      = "${local.auth_gateway_name}-nginx"
    namespace = kubernetes_namespace.onyxia.metadata[0].name

    labels = {
      "app.kubernetes.io/name"      = local.auth_gateway_name
      "app.kubernetes.io/component" = "gateway"
      "app.kubernetes.io/part-of"   = var.release_name
    }
  }

  data = {
    "default.conf" = local.auth_gateway_nginx_config
  }
}

resource "kubernetes_manifest" "auth_gateway_deployment" {
  count = var.enable_oauth2_proxy_gateway ? 1 : 0

  manifest = {
    apiVersion = "apps/v1"
    kind       = "Deployment"
    metadata = {
      name      = local.auth_gateway_name
      namespace = kubernetes_namespace.onyxia.metadata[0].name
      labels = {
        "app.kubernetes.io/name"      = local.auth_gateway_name
        "app.kubernetes.io/component" = "gateway"
        "app.kubernetes.io/part-of"   = var.release_name
      }
    }
    spec = {
      replicas = 1
      selector = {
        matchLabels = {
          "app.kubernetes.io/name" = local.auth_gateway_name
        }
      }
      template = {
        metadata = {
          labels = {
            "app.kubernetes.io/name"      = local.auth_gateway_name
            "app.kubernetes.io/component" = "gateway"
            "app.kubernetes.io/part-of"   = var.release_name
          }
        }
        spec = {
          containers = [
            {
              name  = "nginx"
              image = var.auth_gateway_nginx_image
              ports = [
                {
                  name          = "http"
                  containerPort = 8080
                }
              ]
              readinessProbe = {
                httpGet = {
                  path = "/healthz"
                  port = "http"
                }
              }
              livenessProbe = {
                httpGet = {
                  path = "/healthz"
                  port = "http"
                }
              }
              resources = {
                requests = {
                  cpu                 = "50m"
                  memory              = "64Mi"
                  "ephemeral-storage" = "64Mi"
                }
                limits = {
                  memory              = "128Mi"
                  "ephemeral-storage" = "64Mi"
                }
              }
              volumeMounts = [
                {
                  name      = "nginx-config"
                  mountPath = "/etc/nginx/conf.d"
                  readOnly  = true
                }
              ]
            }
          ]
          volumes = [
            {
              name = "nginx-config"
              configMap = {
                name = kubernetes_config_map.auth_gateway_nginx[0].metadata[0].name
              }
            }
          ]
        }
      }
    }
  }

  depends_on = [helm_release.onyxia, kubernetes_manifest.oauth2_proxy_service]
}

resource "kubernetes_manifest" "auth_gateway_backend_config" {
  count = var.enable_oauth2_proxy_gateway ? 1 : 0

  manifest = {
    apiVersion = "cloud.google.com/v1"
    kind       = "BackendConfig"
    metadata = {
      name      = local.auth_gateway_name
      namespace = kubernetes_namespace.onyxia.metadata[0].name
    }
    spec = {
      healthCheck = {
        type               = "HTTP"
        requestPath        = "/healthz"
        port               = 8080
        checkIntervalSec   = 15
        timeoutSec         = 5
        healthyThreshold   = 1
        unhealthyThreshold = 2
      }
    }
  }
}

resource "kubernetes_manifest" "auth_gateway_service" {
  count = var.enable_oauth2_proxy_gateway ? 1 : 0

  manifest = {
    apiVersion = "v1"
    kind       = "Service"
    metadata = {
      name      = local.auth_gateway_name
      namespace = kubernetes_namespace.onyxia.metadata[0].name
      annotations = {
        "cloud.google.com/backend-config" = jsonencode({ default = local.auth_gateway_name })
        "cloud.google.com/neg"            = jsonencode({ ingress = true })
      }
      labels = {
        "app.kubernetes.io/name"      = local.auth_gateway_name
        "app.kubernetes.io/component" = "gateway"
        "app.kubernetes.io/part-of"   = var.release_name
      }
    }
    spec = {
      type = "ClusterIP"
      selector = {
        "app.kubernetes.io/name" = local.auth_gateway_name
      }
      ports = [
        {
          name       = "http"
          port       = 80
          targetPort = "http"
        }
      ]
    }
  }

  depends_on = [
    kubernetes_manifest.auth_gateway_backend_config,
    kubernetes_manifest.auth_gateway_deployment
  ]
}

resource "kubernetes_manifest" "auth_gateway_ingress" {
  count = var.enable_oauth2_proxy_gateway ? 1 : 0

  manifest = {
    apiVersion = "networking.k8s.io/v1"
    kind       = "Ingress"
    metadata = {
      name      = var.release_name
      namespace = kubernetes_namespace.onyxia.metadata[0].name
      annotations = {
        "cert-manager.io/cluster-issuer"           = var.cert_manager_cluster_issuer_name
        "nginx.ingress.kubernetes.io/ssl-redirect" = "true"
        # ingress-nginx is configured cluster-wide with a `global-auth-url`
        # so that user services inherit the oauth2-proxy auth_request. The
        # gateway Ingress itself must opt out, otherwise /oauth2/start would
        # require authentication and the browser loops on ERR_TOO_MANY_REDIRECTS.
        "nginx.ingress.kubernetes.io/enable-global-auth" = "false"
      }
      labels = {
        "app.kubernetes.io/name"      = local.auth_gateway_name
        "app.kubernetes.io/component" = "gateway"
        "app.kubernetes.io/part-of"   = var.release_name
      }
    }
    spec = {
      ingressClassName = var.services_ingress_class_name
      tls = [
        {
          hosts      = [var.public_hostname]
          secretName = "${var.release_name}-tls"
        }
      ]
      defaultBackend = {
        service = {
          name = local.auth_gateway_name
          port = {
            number = 80
          }
        }
      }
      rules = [
        {
          host = var.public_hostname
          http = {
            paths = [
              {
                path     = "/"
                pathType = "Prefix"
                backend = {
                  service = {
                    name = local.auth_gateway_name
                    port = {
                      number = 80
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  }

  depends_on = [
    helm_release.onyxia,
    kubernetes_manifest.cert_manager_cluster_issuer,
    kubernetes_manifest.auth_gateway_service,
    helm_release.services_ingress_nginx
  ]
}
