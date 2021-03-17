# build environment
FROM node:14.16.0-alpine as build
WORKDIR /app
COPY package.json yarn.lock .env ./
COPY .storybook/.compatibility .storybook/.compatibility
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

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