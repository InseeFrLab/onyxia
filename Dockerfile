# Before editing this, please be aware that: 
# 1) The app and the Keycloak theme can't be build separately. 
#    ref: https://github.com/InseeFrLab/keycloakify#enable-loading-in-a-blink-of-an-eye-of-login-pages----external-assets
# 2) We use react-envs.
#    Doc: https://github.com/garronej/react-envs
#
# This Dockerfile is not ment to be run manually but in the CI pipeline: 
# https://github.com/InseeFrLab/onyxia-web/blob/main/.github/workflows/ci.yml

# build environment
FROM node:14.16.0-alpine as build
WORKDIR /app
#We assume that there is is a build.tar file in the CWD
#We use ADD instead of COPY because build/ is in .dockerignore
ADD build.tar .
COPY .env .
COPY nginx.conf .
# We assume there is a re.json file contaning '{ "version": "X.Y.Z" }' 
# 'X.Y.Z' beeing the version react-envs in use in the project.
COPY re.json node_modules/react-envs/package.json 

# production environment
FROM nginx:stable-alpine
RUN apk add --update nodejs npm
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf    
COPY --from=build /app/node_modules/react-envs/package.json ./re.json
RUN npm i -g react-envs@`node -e 'console.log(require("./re.json")["version"])'`
WORKDIR /usr/share/nginx
COPY --from=build /app/build ./html
COPY --from=build /app/.env .
ENTRYPOINT sh -c "npx embed-environnement-variables && nginx -g 'daemon off;'"