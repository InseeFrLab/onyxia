FROM nginx
COPY build /usr/share/nginx/html
RUN rm etc/nginx/conf.d/default.conf
COPY nginx-onyxia-js.conf etc/nginx/conf.d/

ENTRYPOINT [ "/usr/share/nginx/html/entrypoint.sh" ]
CMD ["nginx", "-g", "daemon off;"]