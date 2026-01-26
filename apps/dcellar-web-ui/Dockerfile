FROM node:20.20.0-bookworm-slim

# Enable Corepack to use the packageManager specified in package.json
RUN corepack enable

WORKDIR /opt/deploy

COPY /common/deploy .

WORKDIR /opt/deploy/apps/dcellar-web-ui

EXPOSE 3000

ENV NODE_ENV production

CMD [ "pnpm", "start" ]
