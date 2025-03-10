FROM node:20-alpine AS build
WORKDIR /app

# Optimize caching by installing dependencies first
ENV YARN_CACHE_FOLDER=/usr/local/share/.cache/yarn

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts --network-timeout 1000000

# Copy source files and build
COPY . .  

RUN --mount=type=cache,target=/app/node_modules/.vite \
    yarn vite-envs update-types && \
    yarn mui-icons-material-lazy postinstall && \
    yarn patch-package && \
    yarn build

# Stage 2: Final Nginx runtime
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Define non-root user variables
ENV NGINX_USER_ID=101
ENV NGINX_GROUP_ID=101
ENV NGINX_USER=nginx

# Temporarily switch to root to install dependencies and configure Nginx
USER root

RUN apk add --update nodejs npm unzip wget && rm -rf /var/cache/apk/*

# Remove default Nginx config and replace it with our own
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf  
COPY --from=build /app/dist /usr/share/nginx/tmp_html/
RUN npm install --ignore-scripts -g vite-envs@`node -e 'console.log(require("/usr/share/nginx/tmp_html/.vite-envs.json").version)'`

# Generating /entrypoint.sh  
# Be mindful that the entrypoint is generated a build time but the 
# bash code is executed at container startup.
RUN echo $'#!/bin/sh                                                                                           \n\
cd /usr/share/nginx                                                                                            \n\
rm -rf ./html/* ./html/.* 2>/dev/null                                                                          \n\
cp -r ./tmp_html/. ./html/                                                                                     \n\
if [ -n "$CUSTOM_RESOURCES" ]; then                                                                            \n\
    wget -O ./html/custom-resources.zip "$CUSTOM_RESOURCES" --ca-certificate="$CUSTOM_RESOURCES_CA_CERTIFICATE"\n\
    unzip ./html/custom-resources.zip -d ./html/custom-resources                                               \n\
    rm ./html/custom-resources.zip                                                                             \n\
fi                                                                                                             \n\
cd html                                                                                                        \n\
npx vite-envs                                                                                                  \n\
exec nginx -g "daemon off;"                                                                                    \n\
' > /usr/share/nginx/entrypoint.sh

# Ensure non-root user has ownership of necessary directories
RUN chown -R $NGINX_USER_ID:$NGINX_GROUP_ID /usr/share/nginx /usr/share/nginx/entrypoint.sh && \
    chmod +x /usr/share/nginx/entrypoint.sh

# Switch back to non-root user for security
USER $NGINX_USER_ID

# Run the entrypoint script
ENTRYPOINT ["/usr/share/nginx/entrypoint.sh"]