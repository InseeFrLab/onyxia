# Before editing this, please be aware that: 
# 1) The app and the Keycloak theme can't be build separately. 
#    ref: https://github.com/InseeFrLab/keycloakify#enable-loading-in-a-blink-of-an-eye-of-login-pages----external-assets
# 2) We use cra-envs.
#    Doc: https://github.com/garronej/cra-envs
#
# The docker image is note ment to be built manually but in the CI pipeline: 
# https://github.com/InseeFrLab/onyxia-web/blob/2576dc99f53d3ddda8dfd3a23f1bcbbdfdd8820b/.github/workflows/ci.yml#L114-L118

# build environment
FROM node:14.16.0-alpine as build
WORKDIR /app
# We assume there is is a build.tar file in the CWD, see how it's optained:
# https://github.com/InseeFrLab/onyxia-web/blob/2576dc99f53d3ddda8dfd3a23f1bcbbdfdd8820b/.github/workflows/ci.yml#L24
# https://github.com/InseeFrLab/onyxia-web/blob/2576dc99f53d3ddda8dfd3a23f1bcbbdfdd8820b/.github/workflows/ci.yml#L30-L33
# https://github.com/InseeFrLab/onyxia-web/blob/2576dc99f53d3ddda8dfd3a23f1bcbbdfdd8820b/.github/workflows/ci.yml#L109-L113
# We use ADD instead of COPY because build/ is in .dockerignore
ADD build.tar .
COPY .env .
COPY nginx.conf .
# We assume there is a cra-envs_package.json file contaning '{ "version": "X.Y.Z" }' 
# 'X.Y.Z' beeing the version cra-envs in use in the project. See how it's optained:
# https://github.com/InseeFrLab/onyxia-web/blob/2576dc99f53d3ddda8dfd3a23f1bcbbdfdd8820b/.github/workflows/ci.yml#L34-L38
# https://github.com/InseeFrLab/onyxia-web/blob/2576dc99f53d3ddda8dfd3a23f1bcbbdfdd8820b/.github/workflows/ci.yml#L15-L16
# https://github.com/InseeFrLab/onyxia-web/blob/2576dc99f53d3ddda8dfd3a23f1bcbbdfdd8820b/.github/workflows/ci.yml#L106-L108
COPY cra-envs_package.json node_modules/cra-envs/package.json 

# production environment
FROM nginx:stable-alpine
RUN apk add --update nodejs npm
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf    
COPY --from=build /app/node_modules/cra-envs/package.json ./cra-envs_package.json
RUN npm i -g cra-envs@`node -e 'console.log(require("./cra-envs_package.json")["version"])'`
WORKDIR /usr/share/nginx
COPY --from=build /app/build ./html
COPY --from=build /app/.env .
# Run as non-root
RUN sed -i.orig -e '/user[[:space:]]\+nginx/d' -e 's@pid[[:space:]]\+.*@pid /tmp/nginx.pid;@' /etc/nginx/nginx.conf && \
    diff -u /etc/nginx/nginx.conf.orig /etc/nginx/nginx.conf ||: && \
    chown nginx /usr/share/nginx/html/index.html && \
    chown -Rc nginx /var/cache/nginx
USER nginx
ENTRYPOINT sh -c "npx embed-environnement-variables && nginx -g 'daemon off;'"
