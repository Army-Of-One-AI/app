FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine 

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --prod --frozen-lockfile

COPY --from=builder ./app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main.js"]