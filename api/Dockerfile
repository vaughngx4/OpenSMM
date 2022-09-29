FROM node:lts-alpine3.15
LABEL maintainer="vaughngx4 (vaughng@pm.me)"
ENV HOME /home/opensmm
ENV APP_TMP_DATA=/tmp
RUN apk add --no-cache --upgrade \
    su-exec
WORKDIR /usr/opensmm/app
COPY ./app ./
RUN npm install
RUN npm install --global nodemon
run chown -R node:node /usr/opensmm/app
COPY ./entrypoint.sh /docker-entrypoint.sh
COPY ./logo.sh /logo.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD su-exec node npm start
