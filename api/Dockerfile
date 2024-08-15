FROM node:20-alpine3.17
LABEL maintainer="vaughngx4 (vaughng@sintelli-tech.com)"

ENV HOME /home/opensmm
ENV APP_TMP_DATA=/tmp

RUN apk add --no-cache --upgrade \
    su-exec \
    ffmpeg

WORKDIR /usr/opensmm/app
COPY ./app ./

RUN npm install
RUN npm install --global nodemon
RUN chown -R node:node /usr/opensmm/app

COPY ./entrypoint.sh /docker-entrypoint.sh
COPY ./logo.sh /logo.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD su-exec node npm start
