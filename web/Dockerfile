FROM node:20-alpine as build
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile --network-timeout 1000000
RUN yarn build


FROM nginx:1.25-alpine
RUN apk add --update nodejs npm
RUN apk add --update wget unzip
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf    
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
RUN npm i -g vite-envs@`node -e 'console.log(require("./.vite-envs.json").version)'`
ENTRYPOINT sh -c "npx vite-envs && nginx -g 'daemon off;'"
# Generating /entrypoint.sh  
# Be mindfull that the entrypoint is generated a build time but the 
# bash code is executed at container startup.
RUN echo $'#!/bin/sh                                                                                           \n\
if [ -n "$CUSTOM_RESOURCES" ]; then                                                                            \n\
    wget -O /tmp/custom-resources.zip "$CUSTOM_RESOURCES" --ca-certificate="$CUSTOM_RESOURCES_CA_CERTIFICATE"  \n\
    unzip /tmp/custom-resources.zip -d ./custom-resources                                                      \n\
fi                                                                                                             \n\
npx vite-envs                                                                                                  \n\
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
