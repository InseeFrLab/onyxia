---
description: Want to contribute on onyxia-web? This documentation website is made for you!
---

# 🚀 Quick start

```bash
# Download the binary files (images, fonts, ect, you need git LFS)
git lfs install && git lfs pull
yarn install
#Setup the var envs to tell the app to connect to INSEE's infra
cp .env.local.sample .env.local

# To stat the app locally
yarn start 
```

Onyxia-web is a single-page-application (SPA) that leverage the following backend technologies:

* [Onyxia API](https://github.com/inseefrlab/onyxia-api): For starting containers (RStudio, Jupyter) on demand on a Kubernetes cluster. We think of it as "the kubernetes API".
* [Keycloak](https://www.keycloak.org): For managing user authentication.
* [Minio](http://minio.lab.sspcloud.fr): An implementation of the S3 standard. 
* [Vault](https://www.vaultproject.io): We use it for two purposes:
  * We don't have a user database on the backend so we use Vault to store [user's prererences](https://github.com/InseeFrLab/onyxia-web/blob/efc32a9ccc2339dec0c4a4c63be5797023c00e14/src/lib/useCases/userConfigs.ts#L29-L40).
  * Users can, from the user interface, define so-called secrets that they can set up to be accessible in their containers (Rstudio, Jupyter ect...) as environment variables. We rely on Vault to implement [this feature](https://datalab.sspcloud.fr/my-secrets/jgarrone).&#x20;

You can run the app locally in degraded mode, for example, if you don't have a Vault server you can run Onyxia-web but the "My Secret" link in the left bar will be greyed. &#x20;

If you want to run onyxai-web locally with all feature enabled, you have to specify the URLs of the  Keycloak, Mnio, Vault and OnyxiaAPI server.

In [`.env.local.sample`](https://github.com/InseeFrLab/onyxia-web/blob/main/.env.local.sample) you have the values for the sspcloud infrastructure. If you use this and run the app locally, everything will be just like datalab.sspcloud.fr. You can update .env.local to run onyxia-web against your own infra if you have one.
