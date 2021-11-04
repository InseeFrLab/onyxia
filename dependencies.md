---
description: Technologies at play in Onyxia-web
---

# 🕸 Dependencies

Modules marked by [🐔](https://apps.timwhitlock.info/emoji/tables/unicode#emoji-modal) are our own. It means that if you need a new feature it can be added in the better delays and your PR will be reviewed in priority over the one of the community.

## Typescript

We are fully committed on keeping everything type safe. If you are a seasoned developer but not fully comfortable with TypeScript yet a good way to get you quickly up to speed is to go through the [What's new section](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html) of the official website.

{% hint style="info" %}
You can skip anything related to `class` we don't do OOP in the project.
{% endhint %}

### tsafe [🐔](https://apps.timwhitlock.info/emoji/tables/unicode#emoji-modal)

{% embed url="https://www.tsafe.dev" %}

We also heavily rely on [tsafe](https://github.com/garronej/tsafe). It's a collection of utilities that help write cleaner TypeScript code. We like to think of it as "_The missing TypeScript builtins_".

### TS-CI [🐔](https://apps.timwhitlock.info/emoji/tables/unicode#emoji-modal)

{% embed url="https://github.com/garronej/ts-ci" %}

We try, whenever we see an opportunity for it, to publish as standalone NPM module chunks of the code we write for Onyxia-web. It help gets the complexity in check. We use TS-CI as a starter for everything we publish on NPM.

## For working on what the end user 👁

Anything contained in the [src/app](https://github.com/InseeFrLab/onyxia-web/tree/main/src/app) directory.

### Onyxia-UI [🐔](https://apps.timwhitlock.info/emoji/tables/unicode#emoji-modal)

{% embed url="https://github.com/InseeFrLab/onyxia-ui" %}

The UI toolkit used in the project, you can find the setup of [onyxia-UI](https://github.com/InseeFrLab/onyxia-ui) in [onyxia-web](https://github.cm/InseeFrLab/onyxia-web) here: [src/app/theme.tsx](https://github.com/InseeFrLab/onyxia-web/blob/main/src/app/theme.tsx).

#### [MUI](https://mui.com) integration

[Onyxia-UI](https://github.com/InseeFrLab/onyxia-ui) is fully compatible with [MUI](https://mui.com).

Onyxia-UI offers a[ library of reusable components](https://ui.onyxia.dev/?path=/story/quick-start--page) but you can also use [MUI](https://mui.com) components in the project, their aspect will automatically be adapted to blend in with the theme.

#### Where do I create new react components

When you create a new react component, you should ask yourself:

* Is it generic enough to be reused in other projects? If yes then it belongs to [Onyxia-UI](https://github.com/garronej/onyxia-ui). Example: [`<Button />`](https://github.com/InseeFrLab/onyxia-ui/blob/main/src/Button.tsx) (see it [live](https://ui.onyxia.dev/?path=/story/sandbox-button--vue-no-icon))
* Will the component be used more than once? If it will then it should be placed in [src/app/components/shared](https://github.com/InseeFrLab/onyxia-web/tree/main/src/app/components/shared). Example [`<Header />`](https://github.com/InseeFrLab/onyxia-web/blob/main/src/app/components/shared/Header.tsx) (see it [live](https://storybook.onyxia.dev/?path=/story/shared-header--vue-user-logged-in)), because it is used [in the App](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/App/App.tsx#L2) and [in the login pages](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/KcApp/Template.tsx#L12).
* Otherwise it's a page-specific component and belongs in a subdirectory of [src/app/components/pages](https://github.com/InseeFrLab/onyxia-web/tree/main/src/app/components/pages). Example: [`<MyServicesCards />`](https://github.com/InseeFrLab/onyxia-web/blob/main/src/app/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesCard.tsx) (see it [live](https://storybook.onyxia.dev/?path=/story/pages-myservices-myservicescards-myservicescard-myservicescard--vue-regular\&args=width:379))

{% hint style="info" %}
To release a new version of [Onyxia-UI](dependencies.md#typescript). You just need to bump the [package.json's version](https://github.com/InseeFrLab/onyxia-ui/blob/470fdb4e54e2b16051ff8b7442ea4d765d76ba92/package.json#L3) and push. [The CI](https://github.com/garronej/ts-ci) will automate publish [a new version on NPM](dependencies.md#typescript).
{% endhint %}

#### Palettes

We currently offers builtin support for [three color palettes](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/theme.tsx#L84-L93):

* France: [datalab.sspcloud.fr?**palette=france**](https://datalab.sspcloud.fr/?palette=france)\*\*\*\*
* Ultraviolet: [datalb.sspcloud.fr?**palette=ultraviolet**](https://datalb.sspcloud.fr/?palette=ultraviolet)\*\*\*\*
* [Default](https://datalab.sspcloud.fr)

#### Fonts

The fonts are loaded in the [public/index.html](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/public/index.html#L6-L115). It's important to keep it that way for Keycloakify.

### tss-react [🐔](https://apps.timwhitlock.info/emoji/tables/unicode#emoji-modal)

{% embed url="https://github.com/garronej/tss-react" %}

The library we use for styling.

Rules of thumbs when it comes to styling:

* Every component should accept[ an optional `className`](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/App/Footer.tsx#L9)prop it should always [overwrite the internal styles](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/App/Footer.tsx#L55).
* A component should not size or position itself. It should always be the responsibility of the parent component to do it. In other words, you should never have `height`, `width`, `top`, `left`, `right`, `bottom `or `margin `in [the root styles](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/App/Footer.tsx#L16-L23) of your components.
* You should never have a color or a dimension hardcoded elsewhere than in [the theme configuration](https://github.com/InseeFrLab/onyxia-web/blob/main/src/app/theme.tsx). Use `theme.spacing()` ([ex1](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesCard.tsx#L24), [ex2](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesCard.tsx#L31), [ex3](https://github.com/InseeFrLab/onyxia-web/blob/95667d66cc6ee835ede8d9d6a9bca5299d11bc1a/src/app/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig/MyServicesSavedConfig.tsx#L30)) and [`theme.colors.useCases.xxx`](https://github.com/InseeFrLab/onyxia-web/blob/08addbc60c820b8306cf8b0ccbe4793bd2f85661/src/app/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig/MyServicesSavedConfigOptions.tsx#L23-L32).

### Storybook

{% embed url="https://storybook.js.org" %}

It enables us to test the graphical components in isolation.

Example:

* Tested component:[ src/app/components/App/Footer.tsx](https://github.com/InseeFrLab/onyxia-web/blob/main/src/app/components/App/Footer.tsx)
* Story for tested component: [src/stories/App/Footer.stories.tsx](https://github.com/InseeFrLab/onyxia-web/blob/main/src/stories/App/Footer.stories.tsx)
* Live result: [storybook.onyxia.dev/?path=/story/app-footer--vue-1](https://storybook.onyxia.dev/?path=/story/app-footer--vue-1)

To launch Storybook locally run the following command:

```bash
yarn storybook
```

{% hint style="success" %}
The storybook is automatically published at [storybook.onyxia.dev](https://storybook.onyxia.dev) by the [CI workflow](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/.github/workflows/ci.yml#L40-L54) to [GitHub Pages](https://user-images.githubusercontent.com/6702424/139530499-60cf58b8-7eff-4692-9ee8-eeddb8e778ab.png).
{% endhint %}

{% hint style="info" %}
We place the stories in [onyxia-web/src/stories](https://github.com/InseeFrLab/onyxia-web/tree/main/src/stories). The directory structure is a mirror of the [onyxia-web/src/app/components](https://github.com/InseeFrLab/onyxia-web/tree/main/src/app/components) directory.
{% endhint %}

{% hint style="info" %}
We create a wrapper ([src/stories/getStory.tsx](https://github.com/InseeFrLab/onyxia-web/blob/main/src/stories/getStory.tsx)) that aims at reducing as much as possible the boilerplate required to create a new story.
{% endhint %}

{% embed url="https://youtu.be/2L7rtAOlqtc" %}
Setting up a new story
{% endembed %}

### react-envs [🐔](https://apps.timwhitlock.info/emoji/tables/unicode#emoji-modal)

{% embed url="https://github.com/garronej/react-envs" %}

We need to be able to do:

```bash
docker run --env OIDC_URL="https://auth.lab.sspcloud.fr/auth" InseeFrLab/onyxia-web
```

Then, somehow, access `OIDC_URL` in the code like `process.env["OIDC_URL"]`.

In theory it shouldn't be possible, onyxia-web is an SPA, it is just static JS/CSS/HTML. If we want to bundle values in the code, we should have to recompile. But this is where [`react-envs`](https://github.com/garronej/react-envs) comes into play.

It enables to run onyxia-web again a specific infrastructure while keeping the app docker image generic.

Checkout [the helm chart](https://github.com/InseeFrLab/paris-sspcloud/blob/812b12e00e8c24f031083ab41949335bd24b9f4b/apps/onyxia/values.yaml#L18-L33):

```
  UI:
    replicaCount: 2
    image:
      name: inseefrlab/onyxia-web
      version: 0.15.13
    env:
      MINIO_URL: https://minio.lab.sspcloud.fr
      VAULT_URL: https://vault.lab.sspcloud.fr
      OIDC_URL: https://auth.lab.sspcloud.fr/auth
      OIDC_REALM: sspcloud
      TITLE: SSP Cloud
```

* All the accepted environment variables are defined here: [.env](https://github.com/InseeFrLab/onyxia-web/blob/main/.env). They are all prefixed with `REACT_APP_` to be compatible [with create-react-app](https://create-react-app.dev/docs/adding-custom-environment-variables/#adding-development-environment-variables-in-env). Default values are defined in this file.
* Only in development (`yarn start`) [`.env.local`](https://github.com/InseeFrLab/onyxia-web/blob/main/.env.local.sample) is also loaded and have priority over `.env`
* Then, in the code the variable can be accessed [like this](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/libApi/LibProvider.tsx#L32).

{% hint style="warning" %}
Please try not to access the environment variable to liberally through out the code. In principle they should ony be accessed [here](https://github.com/InseeFrLab/onyxia-web/blob/main/src/app/libApi/LibProvider.tsx). We try to keep things [pure](https://en.wikipedia.org/wiki/Pure\_function) as much as possible.
{% endhint %}

{% embed url="https://youtu.be/JaX14cborxE" %}

### powerhooks 🐔

{% embed url="https://github.com/garronej/powerhooks" %}

It's a collection general purpose react hooks. Let's document the few use cases you should know about.

#### Avoiding useless re-render of Components

For the sake of performance we enforce that every component be wrapped into [`React.memo()`](https://reactjs.org/docs/react-api.html#reactmemo). It makes that a component only re-render if one of their prop has changed.

However if you use inline functions or [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback) as callbacks props your components will re-render every time anyway:

{% embed url="https://stackblitz.com/edit/react-ts-fyrwng?embed=1&file=index.tsx" %}
Playground to explain the usefulness of useConstCallback
{% endembed %}

As a result we always use [useConstCallback](https://github.com/garronej/powerhooks#useconstcallback) for callback props. And [`useCallbackFactory`](https://github.com/garronej/powerhooks#usecallbackfactory) for callback prop in lists.

#### Measuring Components

It is very handy to be able to get the height and the width of components dynamically. It prevents from having to hardcode dimension when we don’t need to. For that we use [`useDomRect`](https://github.com/garronej/powerhooks#usedomrect)\`\`

### Keycloakify [🐔](https://apps.timwhitlock.info/emoji/tables/unicode#emoji-modal)

{% embed url="https://github.com/InseeFrLab/keycloakify" %}

It's a build tool that enables to implement the login and register pages that users see when they are redirected to Keycloak for authentication.

If the app is being run on Keycloak the [`kcContext`](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/index.tsx#L7) isn't `undefined` and it means shat [we should render the login/register pages](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/index.tsx#L24-L30).

If you want to test, uncomment [this line](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/KcApp/kcContext.ts#L12) and run `yarn start`. You can also test the login pages in a local keycloak container by running `yarn keycloak`. All the instructions will be printed on the console.

The `keycloak-theme.jar` file is automatically [build](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/.github/workflows/ci.yml#L25-L29) and [uploaded as a GitHub release asset](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/.github/workflows/ci.yml#L162) by the CI. See [here](https://github.com/InseeFrLab/onyxia-web/releases/tag/v0.15.13).

### type-routes

{% embed url="https://github.com/typehero/type-route" %}

The library we use for routing. It's like [react-router](https://reactrouter.com) but type safe.

Everything related to routing in the app is contained in the [`src/app/roues`](https://github.com/InseeFrLab/onyxia-web/tree/main/src/app/routes) directory.

We bend the framework a little bit in [formFieldsQueryParameters](https://github.com/InseeFrLab/onyxia-web/blob/main/src/app/routes/formFieldsQueryParameters.ts) to implement the dynamic url of [the service configuration page](https://datalab.sspcloud.fr/launcher/inseefrlab-helm-charts-datascience/jupyter?s3.enabled=false\&resources.limits.memory=%C2%AB55Gi%C2%BB). See [the relevant discussion](https://github.com/typehero/type-route/issues/75) with the library author.

This is a video to demonstrate how to setup a new page and add it to the `<Leftbar/>`.&#x20;

{% embed url="https://youtu.be/ZL9dY7mCW3s?t=1" %}

### i18n

We haven't published it as a separate module but we have our own way of doing internationalization and translation. It happens in [`app/i18n`](https://github.com/InseeFrLab/onyxia-web/tree/main/src/app/i18n).

{% embed url="https://youtu.be/G5-4Oe8yp9I" %}
Setting up translation on a new component
{% endembed %}

### create-react-app

{% embed url="https://create-react-app.dev" %}

The project is a non-ejected [create-react-app](https://reactjs.org/docs/create-a-new-react-app.html) using [typescript template](https://create-react-app.dev/docs/getting-started#creating-a-typescript-app) (you can find [here](https://github.com/garronej/keycloakify-demo-app) the template repo that was used as a base for this project).

We use [react-app-rewired](https://github.com/timarney/react-app-rewired) instead of the default `react-scripts` to be able to use custom Webpack plugins without having to eject the App. The custom webpack plugins that we use are defined here [/config-overrides.json](dependencies.md#setting-up-the-development-environnement). Currently we only one we use is [circular-dependency-plugins](https://www.npmjs.com/package/circular-dependency-plugin).

{% hint style="info" %}
Using [`import type`](https://github.com/InseeFrLab/onyxia-web/blob/f6e2907e43eea825d39f350207705d564360eb23/src/app/components/App/App.tsx#L23) instead of just `import` when importing types definition helps getting rid of many require cicle error.
{% endhint %}

## For working on 🧠 of the App

Anything contained in the [src/lib](https://github.com/InseeFrLab/onyxia-web/tree/main/src/lib) directory.

### Redux Toolkit

{% embed url="https://redux-toolkit.js.org" %}

It's toolset for redux. No need to dig too deep. Getting familiar with the core concept of redux should be more than enough to get you started.

### EVT [🐔](https://apps.timwhitlock.info/emoji/tables/unicode#emoji-modal)

{% embed url="https://www.evt.land" %}

EVT is an event management library (like [RxJS ](https://rxjs.dev)is).

A lot of the things we do is powered under the hood by EVT. You don't need to know EVT to work on onyxia-web however, in order to demystify the parts of the codes that involve it, here are the key ideas to take away:

* If we need to perform particular actions when a value gets changed, we use[`StatefullEvt`](https://docs.evt.land/api/statefulevt).
* We use `Ctx`to detaches event handlers when we no longer need them. (See line 108 on [this playground](https://stackblitz.com/edit/evt-playground?embed=1\&file=index.ts\&hideExplorer=1))
* In React, we use the [useEvt](https://docs.evt.land/react-hooks) hook to work with DOM events.
