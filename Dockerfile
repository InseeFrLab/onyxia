FROM nginx
COPY build /usr/share/nginx/html
RUN chmod 755 /usr/share/nginx/html/entrypoint.sh
RUN rm etc/nginx/conf.d/default.conf
COPY nginx-onyxia-js.conf etc/nginx/conf.d/

ENTRYPOINT [ "/usr/share/nginx/html/entrypoint.sh" ]
CMD ["nginx", "-g", "daemon off;"]