FROM node:lts-alpine3.15
LABEL maintainer="vaughngx4 (vaughng@pm.me)"
ENV HOME /home/opensmm
ENV APP_TMP_DATA=/tmp
RUN apk add --no-cache --upgrade \
    su-exec \
    cron
WORKDIR /usr/opensmm/app
COPY ./app ./
RUN npm install
run chown -R node:node /usr/opensmm/app
COPY ./entrypoint.sh /docker-entrypoint.sh
COPY ./logo.sh /logo.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
