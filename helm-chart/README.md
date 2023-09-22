# Helm Chart of [Onyxia](https://onyxia.sh/)

-   Complete installation guide: https://onyxia.sh/
-   `api` parameters: [../api/README.md](https://github.com/InseeFrLab/onyxia-api/blob/v0.30/README.md#configuration)
-   `web` parameters: [../.env](../.env)

This is a little sample of a typical `onyxia-values.yaml` to show where
the parameters of onyxia-web and onyxia-api should be filled in:

`onyxia-values.yaml`

```yaml
web:
    env:
        THEME_ID=ultraviolet
        TERMS_OF_SERVICES: |
            {
              "en": "https://www.sspcloud.fr/tos_en.md",
              "fr": "https://www.sspcloud.fr/tos_fr.md"
            }
        # ...
api:
    env:
        security.cors.allowed_origins: http://localhost:3000
        authentication.mode: openidconnect
        keycloak.realm: datalab
        keycloak.auth-server-url: https://auth.lab.my-domain.net/auth
    regions:
        [
            {
                "id":"demo",
                "name":"Demo",
                # ...
```
