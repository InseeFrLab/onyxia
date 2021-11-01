<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/139264787-37efc793-1d55-4fa4-a4a9-782af8357cff.png">
</p>
<p align="center">
    🥼  <i>The <a href="https://datalab.sspcloud.fr">Onyxia</a> frontend</i> 🥼
    <br>
    <br>
    <img src="https://github.com/InseeFrLab/onyxia-web/workflows/ci/badge.svg?branch=main">
    <img src="https://img.shields.io/npm/l/onyxia-ui">
</p>

</p>
<p align="center">
  <a href="https://docs.onyxia.dev">Documentation</a>
    -
  <a href="https://datalab.sspcloud.fr">The app live</a>
    -
  <a href="https://github.com/InseeFrLab/onyxia">The Onyxia Project</a>
</p>

<p align="center">
    Want to contribute? There is a website to help you get started: <a href="https://docs.onyxia.dev">docs.onyxia.dev</a>
</p> 

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

