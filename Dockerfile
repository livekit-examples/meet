# Build BASE
FROM node:17-alpine as BASE

WORKDIR /app
COPY package.json yarn.lock ./
RUN apk add --no-cache git curl \
  && curl -sf https://gobinaries.com/tj/node-prune | sh -s -- -b /usr/local/bin \
  && yarn install --frozen-lockfile \
  && yarn cache clean

# Build Image
FROM node:17-alpine AS BUILD

WORKDIR /app
COPY --from=BASE /app/node_modules ./node_modules
COPY --from=BASE /usr/local/bin/node-prune  /usr/local/bin/node-prune 
COPY . .
RUN apk add --no-cache git curl \
  && yarn build \
  && rm -rf node_modules \
  && yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline \
  # Follow https://github.com/ductnn/Dockerfile/blob/master/nodejs/node/16/alpine/Dockerfile
  && node-prune

# Build production
FROM node:17-alpine AS PRODUCTION

WORKDIR /app

COPY --from=BUILD /app/package.json /app/yarn.lock ./
COPY --from=BUILD /app/node_modules ./node_modules
COPY --from=BUILD /app/.next ./.next
COPY --from=BUILD /app/public ./public

EXPOSE 3000

CMD ["yarn", "start"]