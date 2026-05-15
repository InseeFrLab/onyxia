#!/usr/bin/env bash
# Install the prerequisites needed to run the gke-ephemeral example.
#
# Idempotent. Safe to re-run. User-local where possible.
#   - OpenTofu          -> ~/.local/bin/tofu                       (no sudo)
#   - gke-gcloud-auth-plugin -> system package via apt + Google repo (sudo)
#
# Override versions via env: TOFU_VERSION=1.11.7 ./bootstrap.sh
set -euo pipefail

TOFU_VERSION="${TOFU_VERSION:-1.11.7}"
OS_ARCH="linux_amd64"
BIN_DIR="${HOME}/.local/bin"

log()  { printf '\033[0;36m[bootstrap]\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m[bootstrap]\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[0;31m[bootstrap]\033[0m %s\n' "$*" >&2; }

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required base tool '$1' is missing. Install it then re-run."
    exit 1
  fi
}

ensure_user_bin_on_path() {
  mkdir -p "${BIN_DIR}"
  case ":${PATH}:" in
    *":${BIN_DIR}:"*) ;;
    *) warn "${BIN_DIR} is not on PATH. Add this to your shell rc: export PATH=\"\$HOME/.local/bin:\$PATH\"" ;;
  esac
}

install_tofu() {
  if command -v tofu >/dev/null 2>&1 && tofu --version 2>/dev/null | grep -q "v${TOFU_VERSION}"; then
    log "OpenTofu v${TOFU_VERSION} already installed: $(command -v tofu)"
    return
  fi
  log "Installing OpenTofu v${TOFU_VERSION} to ${BIN_DIR}/tofu"
  local url="https://github.com/opentofu/opentofu/releases/download/v${TOFU_VERSION}/tofu_${TOFU_VERSION}_${OS_ARCH}.tar.gz"
  local tmp
  tmp="$(mktemp -d)"
  trap "rm -rf '${tmp}'" RETURN
  curl -fsSL "${url}" -o "${tmp}/tofu.tgz"
  tar -xzf "${tmp}/tofu.tgz" -C "${tmp}" tofu
  install -m 0755 "${tmp}/tofu" "${BIN_DIR}/tofu"
  log "OpenTofu installed: $("${BIN_DIR}/tofu" --version | head -1)"
}

install_gke_auth_plugin() {
  if command -v gke-gcloud-auth-plugin >/dev/null 2>&1; then
    log "gke-gcloud-auth-plugin already installed: $(command -v gke-gcloud-auth-plugin)"
    return
  fi
  log "Installing gke-gcloud-auth-plugin via Google Cloud apt repo (sudo required once)"
  if ! command -v sudo >/dev/null 2>&1; then
    err "sudo is required to install the apt package. Aborting."
    exit 1
  fi
  local keyring="/usr/share/keyrings/cloud.google.gpg"
  local listfile="/etc/apt/sources.list.d/google-cloud-sdk.list"
  if [ ! -s "${keyring}" ]; then
    log "Adding Google Cloud apt signing key"
    curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
      | sudo gpg --dearmor -o "${keyring}"
  fi
  if [ ! -f "${listfile}" ] || ! grep -q "cloud-sdk" "${listfile}"; then
    log "Adding Google Cloud apt repo to ${listfile}"
    echo "deb [signed-by=${keyring}] https://packages.cloud.google.com/apt cloud-sdk main" \
      | sudo tee "${listfile}" >/dev/null
  fi
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends google-cloud-cli-gke-gcloud-auth-plugin
  log "gke-gcloud-auth-plugin installed: $(command -v gke-gcloud-auth-plugin)"
}

main() {
  require_tool curl
  require_tool tar
  require_tool gcloud
  require_tool kubectl
  require_tool helm

  ensure_user_bin_on_path
  install_tofu
  install_gke_auth_plugin

  log "Versions:"
  printf '  tofu                     %s\n' "$(tofu --version | head -1)"
  printf '  gke-gcloud-auth-plugin   %s\n' "$(gke-gcloud-auth-plugin --version 2>/dev/null | head -1 || echo '(ok)')"
  printf '  gcloud                   %s\n' "$(gcloud --version | head -1)"
  printf '  kubectl                  %s\n' "$(kubectl version --client=true 2>/dev/null | head -1)"
  printf '  helm                     %s\n' "$(helm version --short)"
  log "Bootstrap complete."
}

main "$@"
