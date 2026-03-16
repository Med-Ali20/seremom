# -------- BUILD STAGE --------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install   # installs ALL deps including devDependencies

COPY . .

RUN npx prisma generate
RUN npm run build && ls -la dist/   # fail loudly if build produces nothing

# -------- PRODUCTION STAGE --------
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev   # production deps only

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

RUN npx prisma generate   # regenerate client against production node_modules

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/main.js"]