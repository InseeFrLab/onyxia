<p align="center">
    🖥&nbsp;&nbsp;<strong><em>The Web Application</em></strong>&nbsp;&nbsp;🖥️
    <br>
    <br>
    <strong>Interested in Contributing?</strong> Take a look at <a href="https://docs.onyxia.sh/contributors-doc/onyxia">our technical documentation</a>
    <br>
    <br>
</p>

## Overview

This repository contains the source code for the Docker image [inseefrlab/onyxia-web](https://hub.docker.com/r/inseefrlab/onyxia-web).

## Architecture

`onyxia-web` is a Vite Single Page Application (SPA) that runs entirely in the user's browser and is delivered as static files.

## Project Structure

- **UI Layer:** This project utilizes React, but solely as a UI library. The React-specific code is isolated to [src/ui](./src/ui).
- **Core Logic:** The bulk of the application's functionality resides in [src/core](./src/core). Importantly, the core logic is entirely agnostic to React.

## Embedding Onyxia in another application

The image serves `frame-ancestors 'self'`, so a browser refuses to render it inside
a page on any other origin. Set `CSP_FRAME_ANCESTORS` to widen that, and the
entrypoint rewrites the directive before nginx starts — no rebuilt image, and every
other directive in the policy is left alone:

```bash
docker run -it -p 8083:8080 \
    --env ONYXIA_API_URL='https://datalab.sspcloud.fr/api' \
    --env CSP_FRAME_ANCESTORS="'self' https://portal.example.com" \
    inseefrlab/onyxia-web:main
```

Under the Helm chart it is an ordinary entry in `web.env`, needing no chart support:

```yaml
web:
    env:
        CSP_FRAME_ANCESTORS: "'self' https://portal.example.com"
```

The value is written into the header verbatim. `frame-ancestors` takes a
space-separated source list, so quote the whole thing and keep the quotes around
`'self'` — they are part of the CSP grammar, not shell syntax.

## Run the Docker image locally

```bash
docker build -t inseefrlab/onyxia-web:main .
docker run -it -p 8083:8080 --env ONYXIA_API_URL='https://datalab.sspcloud.fr/api' inseefrlab/onyxia-web:main
```

Navigate to http://localhost:8083 in your browser.
