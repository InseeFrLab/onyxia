<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/111553867-7fd50880-8785-11eb-8942-75f161864b5f.png">
</p>
<p align="center">
    <i>A data science oriented container launcher</i>
    <br>
    <br>
    <img src="https://github.com/InseeFrLab/onyxia-web/workflows/ci/badge.svg?branch=main">
    <img src="https://img.shields.io/npm/l/evt">
</p>

</p>
<p align="center">
  <a href="https://datalab.sspcloud.fr" title="Instance of Onyxia hosted in INSEE's data center">Onyxia @ INSEE</a>
  -
  <a href="https://docs.sspcloud.fr/" title="A website for the states workers responsible of producing the french official statistics">Community website</a>
  -
  <a href="https://storybook.onyxia.dev/" title="A website for testing the app components in isolation">Storybook</a>
</p>

---

Onyxia is a web app that aims at being the glue between multiple open source backend technologies to
provide a state of the art data analysis experience.  
Onyxia is developed by the French National institute of statistic and economic studies ([INSEE](https://insee.fr)).

Core feature set:

-   A web GUI where users can upload/download files to/from a S3 servers. (S3 as the open standard, not the AWS service)
-   An interface for launching docker images (e.g: Jupyter, RStudio) on demand on a Kubernetes cluster.
    The catalog of available images is not part of the app and is fully customizable. (You can checkout [here](https://github.com/inseefrlab/helm-charts-datascience) the catalog we offer to our staff on the instance of Onyxia hosted @ INSEE)
-   Users can define the amount of RAM, CPU and GPU they would like to allocate for their containers.
-   When the user log into it's container (e.g: RStudio, Jupyter), the environnement is pre configured according
    to he's profile, the user don't have to fill in it's credentials. For example he can easily access the file
    he previously uploaded from the GUI using the pre-configured minio client. He can also push to GitHub without having to to
    type he's password.
-   Users can provide a bash script to be executed at the start of a container. (e.g: `git clone ... && pip install` )

# Screenshots

![gif_onyxia](https://user-images.githubusercontent.com/6702424/136545513-f623d8c7-260d-4d93-a01e-2dc5af6ad473.gif)
![image](https://user-images.githubusercontent.com/6702424/122631126-8c8d3380-d0c9-11eb-968f-af3e605b0e07.png)
![scree_myservices](https://user-images.githubusercontent.com/6702424/121828699-a8a36600-ccc0-11eb-903c-1cd4b6cbb0ff.png)
![screen_launcher](https://user-images.githubusercontent.com/6702424/121828696-a80acf80-ccc0-11eb-86fb-c7d0bca55d4f.png)
![screen_main_services](https://user-images.githubusercontent.com/6702424/121828700-a93bfc80-ccc0-11eb-8149-f6c85c06cffd.png)
![my_secrets](https://user-images.githubusercontent.com/6702424/121828695-a5a87580-ccc0-11eb-9e86-295fdac6c497.png)

# Contributing

## Development

onyxia-web relies following open sources backend technologies:

-   [Onyxia API](https://github.com/inseefrlab/onyxia-api): For starting containers (RStudio, Jupyter) on demand on a Kubernetes cluster.
-   [keycloak](https://www.keycloak.org): For managing user's authentication.
-   [Minio](http://minio.lab.sspcloud.fr): For storing user's datasets.
-   [Vault](https://www.vaultproject.io): For storing user preferences and custom environnement variable to inject in the containers.

Setting up this infrastructure manually is not documented yet. As a result, if you want to contribute you'll have
to connect to the services hosted on the sspcloud (INSEE's Data center in Paris).
The app is configured using [environnement variables](https://gist.github.com/garronej/e0f7485fac23e8aa0ceda6ce82256df6).

```bash
# Download the binary files (images, fonts ect, you need git LFS)
git lfs install && git lfs pull
yarn install
#Setup the var envs to tell the app to connect to INSEE's infra
cp .env.local.sample .env.local
yarn start # To launch the app
yarn storybook # To test the React's component in isolation.
yarn keycloak # To spin up Keycloak container and test the login/register page. See https://github.com/InseeFrLab/keycloakify
```

## Architecture

The is four source directories:

-   `src/lib/`: Where lies the code for **the logic** of the application.
    It this directory there must be **no reference to React** and it is not allowed to import things from `src/app`.
    `src/app/setup.ts` exposes a function that takes as argument all the params of the app: [address of the keycloak server, url of onyxia-web, ect...](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/src/app/index.tsx#L59-L89)
    This store [is to be be provided at the root of the React application in `src/app/index.tsx`](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/src/app/index.tsx#L59-L89).
    The only way `src/app` (the UI) should interact with `src/lib` (the logic) is by [dispatching thunk](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/src/app/components/pages/MySecrets/MySecrets.tsx#L200-L210) [exposed in `src/app/setup.ts`](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/src/lib/setup.ts#L412-L418)
    any by using selector to access states. All the access to the `src/lib` from `src/app` have been gathered int a single directory [`src/app/interfaceWithLib/hooks`](https://github.com/InseeFrLab/onyxia-web/blob/main/src/app/interfaceWithLib/hooks.ts).
    The store have two very distinct states: When the user is authenticated and when it is not. To test if the user is authenticated use [`appConstants.isUserLogin`](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/src/app/interfaceWithLib/hooks.ts#L28-L31)
    if `isUserLogin` is true then you have access to `store.appConstants.logout()` else `store.appConstants.login()` is defined. [See example](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/src/app/components/App/App.tsx#L194-L209).
    We chose to not make `appConstant` a slice of the store but rather an [object returned by a thunk](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/src/app/interfaceWithLib/hooks.ts#L28-L31)
    because it stores all the values and functions that never changes (for a specific execution of the app, they changes in between reload of the app though, they are not constant as the environnement variables that are hard codded in the bundle.).
-   `src/app/`: The react code.
-   `src/app/assets`: Here should be placed the small assets [imported directly from the code](https://github.com/InseeFrLab/onyxia-web/blob/adf6de0a991fa63e70af17b3fa41849306808dc4/src/app/components/shared/Header.tsx#L7).  
    For bigger assets like video, you should upload them [here](https://github.com/InseeFrLab/onyxia-web/releases/tag/assets) and [hard code the url in the code](https://github.com/InseeFrLab/onyxia-web/blob/adf6de0a991fa63e70af17b3fa41849306808dc4/src/app/components/pages/MySecrets/MySecrets.tsx#L253).  
    To be able to import other kind of files as urls [like here for example with `.md`](https://github.com/InseeFrLab/onyxia-web/blob/adf6de0a991fa63e70af17b3fa41849306808dc4/src/app/components/KcApp/getTosMarkdownUrl.ts#L3-L4) you should declare the file extension like it has been done here [here](https://github.com/InseeFrLab/onyxia-web/blob/adf6de0a991fa63e70af17b3fa41849306808dc4/src/react-app-env.d.ts#L6-L9)
-   `src/stories/`: [Storybook](https://storybook.js.org) stories, to develop the react component in isolation.
-   `*/tools`: All generic code. Everything that could be externalized to a standalone modules independent from the project.
-   `src/js`: Legacy code that hasn't be ported to the new architecture yet.

# OPS

To release a new version, **do not create a tag manually**, simply bump the [`package.json`'s version](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/package.json#L4) then push on the default branch,
the CI will takes charge of publishing on [DockerHub](https://hub.docker.com/r/inseefrlab/onyxia-web)
and creating a GitHub release.

-   A docker image with the tag `:main` is published on DockerHub for every new commit on the `main` branch.
-   When the commit correspond to a new release (the version have changed) the image will also be tagged `:vX.Y.Z`
    and `:latest`.
-   Every commit on branches that have an open pull-request on `main` will trigger the creation of a docker image
    tagged `:<name-of-the-feature-branch>`.

You can find [here](https://github.com/InseeFrLab/paris-sspcloud/blob/main/apps/onyxia/values.yaml) the Helm chart
we use to put the docker image of the app in production.

# NOTE (for self)

To login to local keycloak:

-   In `.env.local` set: `REACT_APP_AUTH_OIDC_URL=http://localhost:8080/auth`
-   After launching and logging in to keycloak create realm: `sspcloud`
-   Root url when you add the "onyxia" client in keycloak: http://localhost:3000
