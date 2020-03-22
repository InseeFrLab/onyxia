# Onyxia UI

This app is used at Insee (https://insee.fr).  
This is the Web UI. See https://github.com/inseefrlab/onyxia-api for the server part.

The opensourcing (and documentation) is still a work in progress, please be patient :)

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
