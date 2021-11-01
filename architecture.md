# 📐 Architecture

## Main rules

* src/app contains the React application, it's the UI of the app.
  * All the import of src/lib should be made in src/app/libApi. ( It's possible to import type anywhere though).
*   src/lib containse the 🧠 of the app.

    * Nothing in the src/lib directory should make any reference to React at all. A concept like react hooks for example is ouf of scope for the src/lib directory.&#x20;
    * src/lib should never import anything from src/app, even type.&#x20;
    * It should be possible for example to port onyxia-web to Vue.js or React Native without changing anything to the src/lib directory.
    * The goal of src/lib is to expose an API that make it realy easy to build a user interface around it.
    * The API exposed should be reactive. We should not expose to the UI functions that returns promise instead the function we expose should update states and the UI should react to thoes states update.



## Clean architecture principles

* Whenever we need to interact with the infrastructure we define a port /src/lib/port. A port is only a type definition. In our case the infrastructure is the Keycloak server, the Vault server, the Minio server the and Kubernetes API (Onyxia-API).
* In src/lib/secondaryAdapter are the implementation of the ports. For each port we should have at least two implementation a dummy and a real one. It enabled the app to still run, be it in degrated mode, if one peace of the infrastructure is missing. Say we don'y have a Vault server for example we should still be able to launch containers.&#x20;
* In src/lib/useCase we expose APIs for the UI to consume.

## In practice

Let's say we want to create a new page in onyxia-web where users can type in a repo name and get the current number of stars the repo has on github.&#x20;

{% embed url="https://youtu.be/RDxAag3Iq0o" %}

Now let's say we want the search to be restricted to a given GitHub organization. (Example: InseeFrLab). The github organization should be specified as an environement variable by the person in chage of deploying Onyxia. e.g:

```yaml
  UI:
    image:
      name: inseefrlab/onyxia-web
      version: 0.15.13
    env:
      MINIO_URL: https://minio.lab.sspcloud.fr
      VAULT_URL: https://vault.lab.sspcloud.fr
      OIDC_URL: https://auth.lab.sspcloud.fr/auth
      OIDC_REALM: sspcloud
      TITLE: SSP Cloud
      ORG_NAME: InseeFrLab #<==========
      
```

If no ORG\_NAME is provided by the administrator the app should always show 999 stars for any repo.

TODO: Insert video
