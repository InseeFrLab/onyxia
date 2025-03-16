<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/231329083-180fe7a2-22a8-470f-910a-ef66300b6f35.png">
</p>
<p align="center">
    <a href="https://github.com/inseefrlab/onyxia/actions">
      <img src="https://github.com/inseefrlab/onyxia/workflows/ci/badge.svg?branch=main">
    </a>
    <a href="https://join.slack.com/t/3innovation/shared_invite/zt-2skhjkavr-xO~uTRLgoNOCm6ubLpKG7Q">
      <img src="https://img.shields.io/badge/slack-550_Members-brightgreen.svg?logo=slack">
    </a>
</p>

<p align="center">
    <b>Don't know Onyxia yet?</b> <a href="https://www.onyxia.sh">Learn about the project</a>
    <br>
    <b>Looking for our public instance?</b> <a href="https://datalab.sspcloud.fr">datalab.sspcloud.fr</a>
    <br>
    <b>Let's get in touch! Join </b> <a href="https://join.slack.com/t/3innovation/shared_invite/zt-2skhjkavr-xO~uTRLgoNOCm6ubLpKG7Q">our Slack</a>
    <br>
    <b>What's next? Checkout our</b> <a href="https://docs.onyxia.sh/roadmap">roadmap</a>
</p>

Onyxia is a web app that aims at being the glue between multiple open source backend technologies to
provide a state of art working environment for data scientists.  
Onyxia is developed by the French National institute of statistics and economic studies ([INSEE](https://insee.fr)) and supported by the Interministerial Digital Directorate (DINUM, [CodeGouvFr](https://twitter.com/codegouvfr)).

<a href="https://youtu.be/FvpNfVrxBFM">
  <img width="1712" alt="image" src="https://user-images.githubusercontent.com/6702424/231314534-2eeb1ab5-5460-4caa-b78d-55afd400c9fc.png">
</a>

**Core feature set**:

-   [An interface for helm charts](https://datalab.sspcloud.fr/catalog/inseefrlab-helm-charts-datascience)
    (e.g: [Jupyter](https://jupyter.org), [RStudio](https://www.rstudio.com)) on demand on a [Kubernetes](https://kubernetes.io) cluster.  
    The catalog of available images is not part of the app, you can create your own.
    ([here](https://github.com/inseefrlab/helm-charts-datascience) is the catalog we build for the institute's needs.)
-   Users can define [the amount of RAM, CPU and **GPU** they would like to allocate](https://user-images.githubusercontent.com/6702424/137818454-3fdb3efb-1fbd-4e4d-85b1-64b00d8af03e.png)
    to their containers.
-   Specify [a custom init script](https://user-images.githubusercontent.com/6702424/137819445-a9dfd053-a5f1-48da-a294-f20717512ef5.png) to be executed at launch.
-   [Define environment variables](https://user-images.githubusercontent.com/6702424/137819689-71e59823-a553-4c3c-8558-2576316e4709.png) to be made available in the containers.
-   [Save and restore your service configurations](https://user-images.githubusercontent.com/6702424/137819972-b9974760-4647-43ff-b985-f3facfce99de.png).
-   Deep integration with S3 for working with data (S3 as the open standard, not the AWS service) and with [Vault](https://www.vaultproject.io)
    (for [secret management](https://user-images.githubusercontent.com/6702424/137820741-bed9ee77-124a-46f6-b686-8b8dff1615bd.png)).
-   [Keycloak integration](https://user-images.githubusercontent.com/6702424/137821446-ed908862-69e3-464c-b347-bd8776a425cc.png).

## Conference talks

<p align="center">
    <i>New Technologies For Statistics 2025</i><br>
    <a href="https://youtu.be/AuCJbipr8rs">
        <img src="https://github.com/user-attachments/assets/d75e1ab4-c510-48ca-a9cb-c41533c216b8" width="420">
    </a>
</p>

<p align="center">
    <i>Offentlig PaaS</i><br>
    <a href="https://youtu.be/7SuXRfQqdGM?si=qGSctmUdjYAjlF4D">
        <img src="https://github.com/user-attachments/assets/ecb3f9fa-cb70-4186-8350-b41a0732e491" width="420">
    </a>
</p>

<p align="center">
    <i>PyData Paris 2024</i><br>
    <a href="https://youtu.be/UFbOBz-Aw1I?si=P8IZ40SnP9aAn-NJ&t=472">
        <img src="https://github.com/user-attachments/assets/4bfc1e54-b9f0-4974-a7bb-4149f2522ca9" width="420">
    </a>
</p>

<p align="center">
    <i>Devoxx France 2023</i><br>
    <a href="https://youtu.be/GXINfnVB21E">
        <img src="https://user-images.githubusercontent.com/6702424/234834115-28a5fc8d-4819-4f6d-abf5-9a9ba25e3749.png" width="420">
    </a>
</p>

<p align="center">
    <i>KCD France 2023</i><br>
    <a href="https://youtu.be/sOOVg4I19BI">
        <img src="https://user-images.githubusercontent.com/6702424/231315763-1a56522d-42a4-4872-ae9b-3f8d3028e09c.png" width="420">
    </a>
</p>

<p align="center">
    <i>Open Source Experience 2022</i><br>
    <a href="https://www.youtube.com/watch?v=QBHyAKcNmS0">
        <img src="https://user-images.githubusercontent.com/6702424/206958731-32480b6c-4fab-432f-8afa-bc7922df9857.png" width="420">
    </a>
</p>

<p align="center">
    <i>OW2Con'23</i><br>
    <a href="https://youtu.be/wBYWEwF7pK8">
        <img src="https://github.com/inseefrlab/onyxia/assets/6702424/48206b71-020c-449e-88f4-5e18323fd3a1" width="420">
    </a>
</p>

<p align="center">
    <i>Energy Data Hack</i><br>
    <a href="https://www.youtube.com/watch?v=1G0J950sWso">
        <img src="https://user-images.githubusercontent.com/6702424/170261575-e5c2345e-4de2-4878-ac06-f362b7affd2a.png" width="420">
    </a>
</p>

<p align="center">
    <i>Article d'acteurs publics</i><br>
    <a href="https://www.acteurspublics.fr/articles/une-boite-a-outils-en-ligne-pour-booster-lexploitation-des-donnees-dans-ladministration">
        <img src="https://user-images.githubusercontent.com/6702424/147030430-afec9c32-372d-4118-85ee-4c773f16d12c.png" width="420">
    </a>
</p>

<p align="center">
    <i>Les Entrepreuneurs d'intérêt général - <a href="https://eig.etalab.gouv.fr">Découvrir le programme</a> </i><br>
    <a href="https://youtu.be/ukMHBAXwzRg">
        <img src="https://user-images.githubusercontent.com/6702424/137893928-e341f3fe-13cf-44e6-9332-7ade8653c7f8.png" width="420">
    </a>
</p>

## Contributing

If your are a new contributor, please refer to the [technical documentation](https://docs.onyxia.sh/contributors-doc).

📣 **Monthly Onyxia Community Calls!** 📣
Starting November 2023, we're thrilled to introduce community calls on the last Friday of every month at 1pm Paris time. This is your chance to engage, ask questions, and stay updated on the newest Onyxia advancements. Don't forget to set a reminder! 📅🕐
