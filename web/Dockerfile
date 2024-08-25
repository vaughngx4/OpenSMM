FROM nginx:1.25.4-alpine3.18
LABEL maintainer="vaughngx4 (vaughng@pm.me)"
WORKDIR /
RUN apk update && apk add --no-cache \
    php81 \
    php81-fpm \
    php81-common \
    php81-cli \
    php81-session \
    php81-json \
    php81-curl \
    php81-redis \
    curl \
    unzip \
    openssl \
    ca-certificates \
    nodejs \
    npm

COPY ./php.ini /etc/php81/php.ini

RUN rm -f /etc/nginx/conf.d/default.conf && \
    mkdir /logs && \
    mkdir -p /var/www/assets/js/modules/masonry && \
    mkdir /ssl

RUN curl -L https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js \
    -o /var/www/assets/js/modules/masonry/masonry.pkgd.min.js && \
    curl -L https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.js \
    -o /var/www/assets/js/modules/masonry/imagesloaded.pkgd.js

RUN apk del unzip curl
RUN rm -rf /var/cache/apk/*

COPY ./www /var/www

RUN cd /var/www/assets && \
    npm install

RUN apk del nodejs npm

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./nginx-opensmm.conf /etc/nginx/templates/opensmm.conf.template
COPY ./logo.sh /logo.sh
COPY ./init.sh /init.sh
COPY ./entrypoint.sh /docker-entrypoint.sh

EXPOSE 80/tcp
EXPOSE 443/tcp

VOLUME /var/www

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD /usr/sbin/nginx && php-fpm81 -O && tail -f /dev/null
