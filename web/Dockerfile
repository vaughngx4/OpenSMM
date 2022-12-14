FROM nginx:alpine
LABEL maintainer="vaughngx4 (vaughng@pm.me)"
WORKDIR /
RUN apk update && apk add --no-cache \
    php8 \
    php8-fpm \
    php8-common \
    php8-cli \
    php8-session \
    php8-json \
    php8-curl \
    php8-redis \
    curl \
    unzip \
    openssl \
    ca-certificates
RUN rm -rf /var/cache/apk/*

COPY ./php.ini /etc/php8/php.ini

RUN rm -f /etc/nginx/conf.d/default.conf && \
    mkdir /logs && \
    mkdir -p /var/www/assets && \
    mkdir /ssl

RUN curl -L https://use.fontawesome.com/releases/v6.1.2/fontawesome-free-6.1.2-web.zip \
    -o /var/www/assets/fa.zip && \
    cd /var/www/assets && \
    unzip fa.zip && \
    mv fontawesome-free-* fontawesome && \
    rm -f fa.zip

RUN apk del unzip curl

COPY ./www /var/www
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./nginx-opensmm.conf /etc/nginx/templates/opensmm.conf.template
COPY ./logo.sh /logo.sh
COPY ./init.sh /init.sh
COPY ./entrypoint.sh /docker-entrypoint.sh

EXPOSE 80/tcp
EXPOSE 443/tcp

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD /usr/sbin/nginx && php-fpm8 -O && tail -f /dev/null
