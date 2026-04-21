FROM mcr.microsoft.com/playwright:v1.51.1-jammy
WORKDIR /app

COPY package.json tsconfig.worker.json tsconfig.json types.d.ts ./
RUN npm install

COPY worker ./worker
COPY lib ./lib

RUN npx tsc -p tsconfig.worker.json

EXPOSE 4000
CMD ["node", "dist-worker/worker/index.js"]
