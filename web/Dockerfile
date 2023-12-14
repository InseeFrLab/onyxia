# build environment
FROM node:18-alpine as build
WORKDIR /app
COPY package.json yarn.lock .env ./
COPY public ./public
COPY patches ./patches
RUN yarn install --frozen-lockfile
COPY config-overrides.js tsconfig.json ./
COPY src ./src
RUN yarn build
COPY nginx.conf ./

# production environment
FROM nginx:stable-alpine
RUN apk add --no-cache wget unzip

# Install cra-envs in the same version used in the build stage. 
# This is needed to run the embed-environnement-variables script.
RUN apk add --no-cache nodejs npm
COPY --from=build /app/node_modules/cra-envs/package.json ./cra-envs_package.json
RUN npm i -g cra-envs@`node -e 'console.log(require("./cra-envs_package.json")["version"])'`

COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf    
WORKDIR /usr/share/nginx
COPY --from=build /app/build ./html
# This is needed to tell cra-env what environment variable we want to embed in the webapp.
COPY --from=build /app/.env .
# public/index.html is infact an ejs template that needs to be rendered with the runtime environment variables, it's handled by cra-envs.
COPY --from=build /app/public/index.html ./public/

# Generating /entrypoint.sh  
# Be mindfull that the entrypoint is generated a build time but the 
# bash code is executed at container startup.
RUN echo $'#!/bin/sh                                                                                           \n\
if [ -n "$CUSTOM_RESOURCES" ]; then                                                                            \n\
    wget -O /tmp/custom-resources.zip "$CUSTOM_RESOURCES" --ca-certificate="$CUSTOM_RESOURCES_CA_CERTIFICATE"  \n\
    unzip /tmp/custom-resources.zip -d /usr/share/nginx/html/custom-resources                                  \n\
fi                                                                                                             \n\
npx embed-environnement-variables                                                                              \n\
exec nginx -g "daemon off;"                                                                                    \n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

# Run nginx as non-root
RUN sed -i.orig -e '/user[[:space:]]\+nginx/d' -e 's@pid[[:space:]]\+.*@pid /tmp/nginx.pid;@' /etc/nginx/nginx.conf && \
    diff -u /etc/nginx/nginx.conf.orig /etc/nginx/nginx.conf ||: && \
    chown nginx html/index.html && \
    chown -Rc nginx html/custom-resources && \
    chown -Rc nginx /var/cache/nginx
# Equivalent to 'USER nginx', see: https://github.com/inseefrlab/onyxia/pull/279
USER 101

ENTRYPOINT ["/entrypoint.sh"]
