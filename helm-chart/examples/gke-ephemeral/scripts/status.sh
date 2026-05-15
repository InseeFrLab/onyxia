#!/usr/bin/env bash
# Show the current state of the gke-ephemeral deployment.
# Read-only. Safe to run any time.
#
# Usage:
#   PROJECT_ID=my-gcp-project ./scripts/status.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_project
require_tool gcloud
require_tool kubectl
require_tool helm

log "gcloud project: ${PROJECT_ID}  location: ${LOCATION}  cluster: ${CLUSTER_NAME}"
kube_ctx_for_cluster

log "nodes"
kubectl get nodes -o wide --no-headers 2>/dev/null | awk '{print "  "$1, $2, $3, $5}' || true

log "helm releases"
helm list -A | sed 's/^/  /'

log "load balancers (services type=LoadBalancer)"
kubectl get svc -A --field-selector spec.type=LoadBalancer -o custom-columns='NS:.metadata.namespace,NAME:.metadata.name,IP:.status.loadBalancer.ingress[0].ip,PORTS:.spec.ports[*].port' --no-headers 2>/dev/null | sed 's/^/  /' || true

log "ingresses"
kubectl get ingress -A -o custom-columns='NS:.metadata.namespace,NAME:.metadata.name,CLASS:.spec.ingressClassName,HOSTS:.spec.rules[*].host,ADDRESS:.status.loadBalancer.ingress[0].ip' --no-headers 2>/dev/null | sed 's/^/  /' || true

log "certificates"
kubectl get certificate -A -o custom-columns='NS:.metadata.namespace,NAME:.metadata.name,READY:.status.conditions[?(@.type=="Ready")].status,SECRET:.spec.secretName' --no-headers 2>/dev/null | sed 's/^/  /' || true

log "user-default workloads"
kubectl -n user-default get pods,svc,ingress 2>/dev/null | sed 's/^/  /' || true

log "cost reminder"
cat <<EOF
  - GKE Autopilot control plane: ~\$2.40/d (often covered by GCP free tier).
  - 1 NLB for the ingress-nginx LoadBalancer:  ~\$0.60/d.
  - Onyxia core + ingress-nginx + cert-manager pods: ~\$0.70/d.
  - Idle user services (Jupyter etc.) typically add ~\$1-2/d each.
  - Shut down user services in the Onyxia UI when you stop working.
EOF
