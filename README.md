---
description: Want to contribute on onyxia-web? This documentation website is made for you!
---

# 🚀 Quick start

```bash
# Download the binary files (images, fonts ect, you need git LFS)
git lfs install && git lfs pull
yarn install
#Setup the var envs to tell the app to connect to INSEE's infra
cp .env.local.sample .env.local

# To stat the app locally
yarn start 
```

Onyxia-web is a single-page-application (SPA) that leverage the following backend technologies:

* [Onyxia API](https://github.com/inseefrlab/onyxia-api): For starting containers (RStudio, Jupyter) on demand on a Kubernetes cluster. We think of it as "the kubernetes API".
* [Keycloak](https://www.keycloak.org): For managing user's authentication.
* [Minio](http://minio.lab.sspcloud.fr): A S3 API implementation where user can upload and access their datasets.
* [Vault](https://www.vaultproject.io): We use it for two purposes:
  * We don't have a user database on the backend so we use vault to store [user's prererences](https://github.com/InseeFrLab/onyxia-web/blob/efc32a9ccc2339dec0c4a4c63be5797023c00e14/src/lib/useCases/userConfigs.ts#L29-L40).
  * Users can, from the user interface, define so called "secrets" that they can setup to be accessible in their containers (Rstudio, Jupyter ect...) as environement variables. We rely on Vault to implement [this feature](https://datalab.sspcloud.fr/my-secrets/jgarrone).&#x20;

You can run the app locally in degrated mode without any of theses available but the app will run in degrated mode with features disabled. &#x20;

If you want to run onyxai-web locally with all feature enabled you have to specify the urls of the  Keycloak, Mnio, Vault and OnyxiaAPI server.

To provides these information without having to re compile we use [react-envs](https://github.com/garronej/react-envs).&#x20;

In [`.env.local.sample`](https://github.com/InseeFrLab/onyxia-web/blob/main/.env.local.sample) you have the values to connect to connect the the sspcloud infrastructure. If you use thoes and run the app localy everything will be just like datalab.sspcloud.fr. You can update .env.local to run onyxia-web against your own infra if you have one.
