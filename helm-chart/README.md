# Helm Chart of [Onyxia](https://onyxia.sh/)

## Installation

```bash
helm repo add onyxia https://inseefrlab.github.io/onyxia

cat << EOF > ./onyxia-values.yaml
ingress:
  enabled: true
  hosts:
    - host: datalab.yourdomain.com
EOF

helm install onyxia onyxia/onyxia --version "4.0.1" -f onyxia-values.yaml
```

Complete installation guide: https://onyxia.sh/

## Parameter Documentation

-   [`api` Parameters](https://github.com/InseeFrLab/onyxia-api/blob/v0.30/README.md#configuration)
-   [`web` Parameters](https://github.com/InseeFrLab/onyxia/blob/v2.29.4/.env)

> **Note:** The links above are automatically updated to always point to the relevant documentation for the current version of the Onyxia Helm Chart.

Below is a sample `onyxia-values.yaml` file that illustrates where to specify the `api` and `web`.

### Sample `onyxia-values.yaml`

```diff
 ingress:
     enabled: true
     hosts:
       - host: datalab.yourdomain.com
+web:
+    env:
+        THEME_ID=ultraviolet
+        TERMS_OF_SERVICES: |
+            {
+              "en": "https://www.sspcloud.fr/tos_en.md",
+              "fr": "https://www.sspcloud.fr/tos_fr.md"
+            }
+        # ...
+api:
+    env:
+        security.cors.allowed_origins: http://localhost:3000
+        authentication.mode: openidconnect
+        keycloak.realm: datalab
+        keycloak.auth-server-url: https://auth.lab.my-domain.net/auth
+    regions:
+        [
+            {
+                "id":"demo",
+                "name":"Demo",
+                # ...
```