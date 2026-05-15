#!/usr/bin/env bash
# Tear the gke-ephemeral example down.
#
# Default scope: the app layer only (Onyxia + ingress-nginx + cert-manager,
# the two LBs and the Onyxia ingress). The cluster, VPC and bootstrap state
# stay up. Use --full to also destroy the cluster and VPC.
#
# Usage:
#   PROJECT_ID=my-gcp-project ./scripts/down.sh         # destroy app layer
#   PROJECT_ID=my-gcp-project ./scripts/down.sh --full  # destroy everything
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_project
require_tool tofu

FULL=0
for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//' | head -20
      exit 0
      ;;
    *) err "unknown arg: $arg"; exit 2 ;;
  esac
done

log "tofu destroy app layer"
( cd "${TF_APP_DIR}" && tofu destroy -input=false -auto-approve )

if [ "${FULL}" -eq 1 ]; then
  for layer in cluster base; do
    dir="${EXAMPLE_DIR}/terraform/${layer}"
    if [ -d "${dir}" ]; then
      log "tofu destroy ${layer} layer"
      ( cd "${dir}" && tofu destroy -input=false -auto-approve )
    fi
  done
fi

log "down complete."
