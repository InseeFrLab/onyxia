FROM node:20-alpine as build
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile --network-timeout 1000000
RUN yarn build


FROM nginx:stable-alpine
RUN apk add --update nodejs npm
RUN apk add --update wget unzip
RUN npm i -g vite-envs@`node -e 'console.log(require("./.vite-envs.json").version)'`
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf    
COPY --from=build /app/dist /usr/share/nginx/tmp_html

# Run nginx as non-root
RUN sed -i.orig -e '/user[[:space:]]\+nginx/d' -e 's@pid[[:space:]]\+.*@pid /tmp/nginx.pid;@' /etc/nginx/nginx.conf && \
    diff -u /etc/nginx/nginx.conf.orig /etc/nginx/nginx.conf ||: && \
    chown -R 101:101 /usr/share/nginx && \
    chown -Rc 101 /var/cache/nginx
# Equivalent to 'USER nginx', see: https://github.com/inseefrlab/onyxia/pull/279
USER 101

# Generating /entrypoint.sh  
# Be mindfull that the entrypoint is generated a build time but the 
# bash code is executed at container startup.
RUN echo $'#!/bin/sh                                                                                           \n\
cd /usr/share/nginx/tmp_html                                                                                   \n\
if [ -n "$CUSTOM_RESOURCES" ]; then                                                                            \n\
    wget -O /tmp/custom-resources.zip "$CUSTOM_RESOURCES" --ca-certificate="$CUSTOM_RESOURCES_CA_CERTIFICATE"  \n\
    unzip /tmp/custom-resources.zip -d ./custom-resources                                                      \n\
fi                                                                                                             \n\
npx vite-envs                                                                                                  \n\
cd ..                                                                                                          \n\
mv tmp_html/* tmp_html/.* html/ 2>/dev/null                                                                    \n\
rm -r tmp_html                                                                                                 \n\
exec nginx -g "daemon off;"                                                                                    \n\
' > /usr/share/nginx/entrypoint.sh && chmod +x /usr/share/nginx/entrypoint.sh

ENTRYPOINT ["/usr/share/nginx/entrypoint.sh"]
