FROM node:20-alpine as base

FROM base as builder

RUN corepack enable

WORKDIR /home/node/app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm build

FROM base as runtime

ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js

WORKDIR /home/node/app
COPY package*.json  ./

RUN pnpm install --production
COPY --from=builder /home/node/app/dist ./dist
COPY --from=builder /home/node/app/build ./build

EXPOSE 3000

CMD ["node", "dist/server.js"]
