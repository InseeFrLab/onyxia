FROM node:13 as build  
ADD . .
RUN npm install  
RUN npm run build

FROM nginx
COPY --from=build build /usr/share/nginx/html
RUN rm etc/nginx/conf.d/default.conf
COPY nginx-onyxia-js.conf etc/nginx/conf.d/

COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ["nginx", "-g", "daemon off;"]