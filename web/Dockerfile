FROM nginx:alpine
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
    ca-certificates

COPY ./php.ini /etc/php8/php.ini

RUN rm -f /etc/nginx/conf.d/default.conf && \
    mkdir /logs && \
    mkdir -p /var/www/assets/js/modules/masonry && \
    mkdir /ssl

RUN curl -L https://use.fontawesome.com/releases/v6.1.2/fontawesome-free-6.1.2-web.zip \
    -o /var/www/assets/fa.zip && \
    cd /var/www/assets && \
    unzip fa.zip && \
    mv fontawesome-free-* fontawesome && \
    rm -f fa.zip

RUN curl -L https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js \
    -o /var/www/assets/js/modules/masonry/masonry.pkgd.min.js && \
    curl -L https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.js \
    -o /var/www/assets/js/modules/masonry/imagesloaded.pkgd.js

RUN apk del unzip curl
RUN rm -rf /var/cache/apk/*

COPY ./www /var/www
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
