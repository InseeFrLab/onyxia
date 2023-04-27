<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/231329083-180fe7a2-22a8-470f-910a-ef66300b6f35.png">
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
    <b>Looking for our public instance?</b> <a href="https://datalab.sspcloud.fr">datalab.sspcloud.fr</a>
    <br>
    <b>Let's get in touch! Join </b> <a href="https://join.slack.com/t/3innovation/shared_invite/zt-1hnzukjcn-6biCSmVy4qvyDGwbNI~sWg">our Slack</a>
</p>

Onyxia is a web app that aims at being the glue between multiple open source backend technologies to
provide a state of art working environnement for data scientists.  
Onyxia is developed by the French National institute of statistics and economic studies ([INSEE](https://insee.fr)) and the Interministerial Digital Directorate (DINUM, [CodeGouvFr](https://twitter.com/codegouvfr)).

<a href="https://youtu.be/FvpNfVrxBFM">
  <img width="1712" alt="image" src="https://user-images.githubusercontent.com/6702424/231314534-2eeb1ab5-5460-4caa-b78d-55afd400c9fc.png">
</a>

**Core feature set**:

-   [An interface for launching docker images](https://datalab.sspcloud.fr/catalog/inseefrlab-helm-charts-datascience)
    (e.g: [Jupyter](https://jupyter.org), [RStudio](https://www.rstudio.com)) on demand on a [Kubernetes](https://kubernetes.io) cluster.  
    The catalog of available images is not part of the app, you can create your own.
    ([here](https://github.com/inseefrlab/helm-charts-datascience) is the catalog we build for the institute's needs.)
-   Users can define [the amount of RAM, CPU and **GPU** they would like to allocate](https://user-images.githubusercontent.com/6702424/137818454-3fdb3efb-1fbd-4e4d-85b1-64b00d8af03e.png)
    to their containers.
-   Specify [a custom init script](https://user-images.githubusercontent.com/6702424/137819445-a9dfd053-a5f1-48da-a294-f20717512ef5.png) to be executed at launch.
-   [Define environnement variables](https://user-images.githubusercontent.com/6702424/137819689-71e59823-a553-4c3c-8558-2576316e4709.png) to be made available in the containers.
-   [Save and restore your service service configurations](https://user-images.githubusercontent.com/6702424/137819972-b9974760-4647-43ff-b985-f3facfce99de.png)
-   Deep integration with S3 for working with data (S3 as the open standard, not the AWS service) and with [Vault](https://www.vaultproject.io)
    (for [secret management](https://user-images.githubusercontent.com/6702424/137820741-bed9ee77-124a-46f6-b686-8b8dff1615bd.png))
-   [Keycloak integration](https://user-images.githubusercontent.com/6702424/137821446-ed908862-69e3-464c-b347-bd8776a425cc.png).

## Media

<p align="center">
    <i>Devoxx France 2023</i><br>
    <a href="https://youtu.be/GXINfnVB21E">
        <img src="https://user-images.githubusercontent.com/6702424/234834115-28a5fc8d-4819-4f6d-abf5-9a9ba25e3749.png" width="640">
    </a>
</p>

<p align="center">
    <i>KCD France 2023</i><br>
    <a href="https://youtu.be/sOOVg4I19BI">
        <img src="https://user-images.githubusercontent.com/6702424/231315763-1a56522d-42a4-4872-ae9b-3f8d3028e09c.png" width="640">
    </a>
</p>

<p align="center">
    <i>Open Source Experience 2022</i><br>
    <a href="https://www.youtube.com/watch?v=QBHyAKcNmS0">
        <img src="https://user-images.githubusercontent.com/6702424/206958731-32480b6c-4fab-432f-8afa-bc7922df9857.png" width="640">
    </a>
</p>

<p align="center">
    <i>Energy Data Hack</i><br>
    <a href="https://www.youtube.com/watch?v=1G0J950sWso">
        <img src="https://user-images.githubusercontent.com/6702424/170261575-e5c2345e-4de2-4878-ac06-f362b7affd2a.png">
    </a>
</p>

<p align="center">
    <i>OpenLAB - <a href="https://speakerdeck.com/etalabia/openlab-onyxia-06122021?slide=6">Download slides</a></i><br>
    <a href="https://bbb-dinum-scalelite.visio.education.fr/playback/presentation/2.3/9be5b08deee82b1ba557f360214500580cfbda51-1638792324069">
        <img src="https://user-images.githubusercontent.com/6702424/147028499-cab9868d-1cee-439d-a777-59f5c2169b3a.png">
    </a>
</p>

<p align="center">
    <i>Article d'acteurs publics</i><br>
    <a href="https://www.acteurspublics.fr/articles/une-boite-a-outils-en-ligne-pour-booster-lexploitation-des-donnees-dans-ladministration">
        <img src="https://user-images.githubusercontent.com/6702424/147030430-afec9c32-372d-4118-85ee-4c773f16d12c.png">
    </a>
</p>

<p align="center">
    <i>Les Entrepreuneurs d'intérêt général - <a href="https://eig.etalab.gouv.fr">Découvrir le programme</a> </i><br>
    <a href="https://youtu.be/ukMHBAXwzRg">
        <img src="https://user-images.githubusercontent.com/6702424/137893928-e341f3fe-13cf-44e6-9332-7ade8653c7f8.png">
    </a>
</p>

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
