#!/usr/bin/env bash
# Bring the gke-ephemeral example up.
# Idempotent: re-running it converges to the declared state.
#
# Usage:
#   PROJECT_ID=my-gcp-project ./scripts/up.sh
#
# Optional env: LOCATION (default us-central1), CLUSTER_NAME (default onyxia-test).
# Reads variables from terraform/app/terraform.tfvars (gitignored).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_project
require_tool tofu

log "tofu init"
( cd "${TF_APP_DIR}" && tofu init -input=false -upgrade=false )

log "tofu apply"
( cd "${TF_APP_DIR}" && tofu apply -input=false -auto-approve )

log "configure kubectl context"
kube_ctx_for_cluster

log "done. helm releases:"
helm list -A
