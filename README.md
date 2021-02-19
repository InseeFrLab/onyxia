# Onyxia UI

![Build](https://github.com/inseefrlab/onyxia-ui/workflows/CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/InseeFrLab/onyxia-ui/badge.svg?branch=master)](https://coveralls.io/github/InseeFrLab/onyxia-ui?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Onyxia, a platform that provide tools for data analysis.
It provides R Studio and python environnement alongside many other service that you can start on demand.
Onyxia is developed by the French National institute of statistic and economic studies ( [Insee](https://insee.fr) ).  
This project is the frontend part of the platform (the website, build with React).
It interacts with the [Onyxia-API](https://github.com/inseefrlab/onyxia-api) (Rest API).

## Documentation

The documentation can be found in the [docs](https://github.com/InseeFrLab/onyxia-ui/tree/master/docs) folder and [browsed online](https://inseefrlab.github.io/onyxia-ui).

# UI

UI components are displayed on [Storybook](https://inseefrlab.github.io/onyxia-ui/storybook)

## Quick start

### Using docker

```
docker run -p 8080:8080 --env BASE_API_URL=https://onyxia-api.yourdomain.com inseefrlab/onyxia-ui
```

### Using NodeJS

We recommend using `yarn` instead of `npm` but both should work just fine.

```
yarn
yarn start
```

## Configuration

Main configuration file is [.env](.env). You can either fill it or create a `.env.local` locally.  
Each variable can be overriden using environment variables.
