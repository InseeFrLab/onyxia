<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/139264787-37efc793-1d55-4fa4-a4a9-782af8357cff.png">
</p>
<p align="center">
    <a href="https://github.com/InseeFrLab/onyxia-web/actions">
      <img src="https://github.com/InseeFrLab/onyxia-web/workflows/ci/badge.svg?branch=main">
    </a>
    <a href="https://join.slack.com/t/3innovation/shared_invite/zt-1hnzukjcn-6biCSmVy4qvyDGwbNI~sWg">
      <img src="https://camo.githubusercontent.com/552ad37eb845d5e54e1bef55f3ea7adb185f36c845a6b676eec85e97122b2fcd/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f736c61636b2d6a6f696e2d6f72616e67652e737667">
    </a>
</p>

<p align="center">
    <b>Don't know Onyxia yet?</b> <a href="https://www.onyxia.sh">Learn about the project</a>
    <br>
    <b>Want to see what it looks like?</b> <a href="https://datalab.sspcloud.fr/catalog/inseefrlab-helm-charts-datascience">datalab.sspcloud.fr</a>
    <br>
    <b>Let's get in touch! Join </b> <a href="https://join.slack.com/t/3innovation/shared_invite/zt-1hnzukjcn-6biCSmVy4qvyDGwbNI~sWg">our Slack</a>
</p>

> 🗣 v1 (of onyxia-web) have been released with a breaking change. Please checkout [the migration guide](https://docs.onyxia.sh/update-to-v1)

<p align="center">
<img src="https://user-images.githubusercontent.com/6702424/136545513-f623d8c7-260d-4d93-a01e-2dc5af6ad473.gif" />
</p>

### Launching a container

https://user-images.githubusercontent.com/6702424/152631131-44050af8-a979-4c25-b09a-1a5521558361.mp4

### S3 File explorer

https://user-images.githubusercontent.com/6702424/161458858-57321269-5a10-42e3-971a-80a505928fb5.mp4

### Vault secret manager

For injecting secret environment variables in the containers.

https://user-images.githubusercontent.com/6702424/154877930-ce5dab0b-e508-43b5-a3d5-51bd6105ac45.mov

## Contributing

If your are a new contributor, please refer to the [technical documentation](https://docs.onyxia.sh/contributing).

### CD Pipeline

To release a new version, **do not create a tag manually**, simply bump the [`package.json`'s version](https://github.com/InseeFrLab/onyxia-web/blob/4842ba8fd3c2ae9c03c52b7467d3c77f6e29e9d9/package.json#L4) then push on the default branch,
the CI will takes charge of publishing on [DockerHub](https://hub.docker.com/r/inseefrlab/onyxia-web)
and creating a [GitHub release](https://github.com/InseeFrLab/onyxia-web/releases).

-   A docker image with the tag `:main` is published on DockerHub for every new commit on the `main` branch.
-   When the commit correspond to a new release (the version has changed) the image will also be tagged `:vX.Y.Z`
    and `:latest`.
-   Every commit on branches that have an open pull-request on `main` will trigger the creation of a docker image
    tagged `:<name-of-the-feature-branch>`.

A CD pipeline is also in place; The CI of this repo [triggers the CI of the GitOPS repo InseeFrLab/paris-sspcloud](https://github.com/InseeFrLab/onyxia-web/blob/ffe0ec4bc027f0993a5af6039a9f83bbe4384b39/.github/workflows/ci.yml#L169-L177). The [CI of paris-sspcloud](https://github.com/InseeFrLab/paris-sspcloud/blob/master/.github/workflows/update.yaml) checks if there is a newer version of Onyxia-web than the one already
in production. If yes, it performs the [automatic commit](https://github.com/InseeFrLab/paris-sspcloud/commit/9b21fa792a113ea16a117cdf74c7c816d36bf84e)
that cause ArgoCD to restart the relevant pods.
