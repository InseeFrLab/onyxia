#!/usr/bin/env bash
# Configure a Keycloak realm `onyxia` with a public PKCE client and a Google
# identity provider. Idempotent (safe to re-run). With the chart's default
# H2 in-memory database, run after every Keycloak restart.
#
# Required env:
#   KC_ADMIN_PASSWORD     Keycloak `admin` bootstrap password (from tfvars).
#   GOOGLE_CLIENT_ID      Google OAuth Web client ID.
#   GOOGLE_CLIENT_SECRET  Google OAuth Web client secret (or set
#                         ONYXIA_OAUTH2_SECRET_NAME to read it from the
#                         Kubernetes Secret created for oauth2-proxy).
#   ONYXIA_HOSTNAME       Public hostname Onyxia is served on (e.g.
#                         onyxia.example.com).
#   KEYCLOAK_HOSTNAME     Public hostname Keycloak is served on (e.g.
#                         auth.onyxia.example.com).
#
# Optional env:
#   KEYCLOAK_NAMESPACE    Default: keycloak
#   KEYCLOAK_POD          Default: keycloak-keycloakx-0
set -euo pipefail

KEYCLOAK_NAMESPACE="${KEYCLOAK_NAMESPACE:-keycloak}"
KEYCLOAK_POD="${KEYCLOAK_POD:-keycloak-keycloakx-0}"
ONYXIA_OAUTH2_SECRET_NAME="${ONYXIA_OAUTH2_SECRET_NAME:-onyxia-oauth2-proxy}"

err() { echo "ERROR: $*" >&2; exit 2; }

[ -n "${KC_ADMIN_PASSWORD:-}" ] || err "set KC_ADMIN_PASSWORD"
[ -n "${GOOGLE_CLIENT_ID:-}" ]  || err "set GOOGLE_CLIENT_ID"
[ -n "${ONYXIA_HOSTNAME:-}" ]   || err "set ONYXIA_HOSTNAME (e.g. onyxia.example.com)"
[ -n "${KEYCLOAK_HOSTNAME:-}" ] || err "set KEYCLOAK_HOSTNAME (e.g. auth.onyxia.example.com)"

if [ -z "${GOOGLE_CLIENT_SECRET:-}" ]; then
  GOOGLE_CLIENT_SECRET="$(kubectl -n onyxia get secret "${ONYXIA_OAUTH2_SECRET_NAME}" -o jsonpath='{.data.client-secret}' 2>/dev/null | base64 -d)" \
    || err "set GOOGLE_CLIENT_SECRET or create Secret '${ONYXIA_OAUTH2_SECRET_NAME}' in ns 'onyxia' with key client-secret"
fi

KCADM=(kubectl -n "$KEYCLOAK_NAMESPACE" exec "$KEYCLOAK_POD" -- /opt/keycloak/bin/kcadm.sh)
SERVER=http://localhost:8080

echo "[init-kc] waiting for pod ${KEYCLOAK_NAMESPACE}/${KEYCLOAK_POD} ready..."
until [ "$(kubectl -n "$KEYCLOAK_NAMESPACE" get pod "$KEYCLOAK_POD" -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null)" = "true" ]; do
  sleep 5
done

echo "[init-kc] login as admin on master realm..."
"${KCADM[@]}" config credentials --server "$SERVER" --realm master --user admin --password "$KC_ADMIN_PASSWORD"

echo "[init-kc] create realm onyxia (idempotent)..."
"${KCADM[@]}" get realms/onyxia >/dev/null 2>&1 \
  || "${KCADM[@]}" create realms -s realm=onyxia -s enabled=true

echo "[init-kc] create client onyxia (public, PKCE) (idempotent)..."
"${KCADM[@]}" get clients -r onyxia --query clientId=onyxia 2>/dev/null | grep -q '"clientId" : "onyxia"' \
  || "${KCADM[@]}" create clients -r onyxia \
      -s clientId=onyxia -s publicClient=true -s standardFlowEnabled=true -s directAccessGrantsEnabled=false \
      -s "redirectUris=[\"https://${ONYXIA_HOSTNAME}/*\"]" \
      -s "webOrigins=[\"https://${ONYXIA_HOSTNAME}\"]" \
      -s 'attributes."pkce.code.challenge.method"=S256'

echo "[init-kc] create Google identity provider (idempotent)..."
"${KCADM[@]}" get identity-provider/instances/google -r onyxia >/dev/null 2>&1 \
  || "${KCADM[@]}" create identity-provider/instances -r onyxia \
      -s alias=google -s providerId=google -s enabled=true -s trustEmail=true \
      -s "config.clientId=$GOOGLE_CLIENT_ID" \
      -s "config.clientSecret=$GOOGLE_CLIENT_SECRET" \
      -s 'config.useJwksUrl=true'

echo "[init-kc] done. Discovery doc:"
curl -s --max-time 10 "https://${KEYCLOAK_HOSTNAME}/realms/onyxia/.well-known/openid-configuration" \
  | head -c 200 || true
echo
