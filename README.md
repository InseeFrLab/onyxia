# Onyxia UI

[![Build Status](https://travis-ci.org/InseeFrLab/onyxia-ui.svg?branch=master)](https://travis-ci.org/InseeFrLab/onyxia-ui)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=InseeFrLab_onyxia-ui&metric=alert_status)](https://sonarcloud.io/dashboard?id=InseeFrLab_onyxia-ui)
[![Coverage Status](https://coveralls.io/repos/github/InseeFrLab/onyxia-ui/badge.svg?branch=master)](https://coveralls.io/github/InseeFrLab/onyxia-ui?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This app is used at [Insee](https://insee.fr).  
This is the Web UI. See [Onyxia-API](https://github.com/inseefrlab/onyxia-api) for the server part.

The opensourcing (and documentation) is still a work in progress, please be patient :)

## Documentation

The documentation can be found in the [docs](https://github.com/InseeFrLab/onyxia-ui/tree/master/docs) folder and [browsed online](https://inseefrlab.github.io/onyxia-ui).

## Quick start

### Using docker

```
docker run -p 8080:8080 --env BASE_API_URL=https://onyxia-api.yourdomain.com inseefrlab/onyxia-ui
```

### Using NodeJS

```
npm install
npm run start
```

## Configuration

Main configuration file is [.env](.env). You can either fill it or create a `.env.local` locally.  
Each variable can be overriden using environment variables.
