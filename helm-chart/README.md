# Onyxia Helm Chart  

Onyxia is distributed as a [Helm](https://helm.sh/) Package.  

> ⬆️ Migrating from an older version? Checkout [the migration guides](https://docs.onyxia.sh/migration-guides)

> The links in this README are automatically updated.  
> You can trust that they'll point to the correct references for this specific version.  

## Installation

These instructions are just the gist for a comprehensive, step-by-step, installation guide
please refer to [the installation guide](https://docs.onyxia.sh).  

```bash
helm repo add onyxia https://InseeFrLab.github.io/onyxia

cat << EOF > ./onyxia-values.yaml
ingress:
  enabled: true
  hosts:
    - host: datalab.my-domain.net
EOF

helm install onyxia onyxia/onyxia --version "10.11.0" -f onyxia-values.yaml
```

### Using the Keycloak Theme (Optional)

If you use [Keycloak](https://www.keycloak.org/) as OIDC provider you can use the Onyxia theme.  
When you update Onyxia, don't forget to also update the Keycloak theme.  

```bash
helm repo add codecentric https://codecentric.github.io/helm-charts

cat << EOF > ./keycloak-values.yaml
# ... See https://docs.onyxia.sh/#enabling-user-authentication
extraInitContainers: |
  - name: realm-ext-provider
    image: curlimages/curl
    imagePullPolicy: IfNotPresent
    command:
      - sh
    args:
      - -c
      - |
        curl -L -f -S -o /extensions/onyxia.jar https://github.com/InseeFrLab/onyxia/releases/download/v10.11.0/keycloak-theme.jar
    volumeMounts:
      - name: extensions
        mountPath: /extensions
extraVolumeMounts: |
  - name: extensions
    mountPath: /opt/jboss/keycloak/standalone/deployments
extraVolumes: |
  - name: extensions
    emptyDir: {}
# ...
EOF

helm install keycloak codecentric/keycloak -f keycloak-values.yaml
```

After that, you should be able to select *onyxia* as *Login Theme*.  

![image](https://github.com/InseeFrLab/onyxia/assets/6702424/e53ac4cf-1787-406d-b360-e61de41d2607)  

> NOTE: You can enable the theme at the realm level or at the onyxia client level.  

## Configuration

Documentation reference for the available configuration parameter of the Onyxia Helm Chart.

-   [The REST API (`api`)](https://github.com/InseeFrLab/onyxia-api/blob/v4.4.0/README.md#configuration)
-   [The Web Application (`web`)](https://github.com/InseeFrLab/onyxia/blob/web-v4.42.0/web/.env)

Below is a sample `onyxia-values.yaml` file that illustrates where to specify the `api` and `web` configuration parameters.

```diff
 ingress:
     enabled: true
     hosts:
       - host: datalab.yourdomain.com
+web:
+    env:
+      HEADER_LOGO=https://example.com/logo.svg
+      HEADER_TEXT_BOLD=Your organization
+      TERMS_OF_SERVICES: |
+        {
+          en: "https://sspcloud.fr/tos_en.md",
+          fr: "https://sspcloud.fr/tos_fr.md",
+        }
+api:
+    env:
+      authentication.mode: openidconnect
+      oidc.issuer-uri: "https://auth.lab.my-domain.net/auth/realms/datalab"
+      oidc.clientID: "onyxia"
+    regions:
+      [
+          {
+              "id":"demo",
+              "name":"Demo",
+              # ...
```

## Catalogs `x-onyxia` specifications

If you are building your own service catalog for Onyxia ([learn how](https://docs.onyxia.sh/catalog-of-services)).  
Here are defined the onyxia reserved parameter and the structure of the dynamic context:

[`values.schema.json` `"x-onyxia"` specifications](https://github.com/InseeFrLab/onyxia/blob/web-v4.42.0/web/src/core/ports/OnyxiaApi/XOnyxia.ts)
