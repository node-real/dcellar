FROM node:16.5.0-buster-slim

WORKDIR /opt/deploy

COPY /common/deploy .

WORKDIR /opt/deploy/apps/dcellar-web-ui

EXPOSE 3000

ENV NODE_ENV production

CMD [ "yarn", "start" ]