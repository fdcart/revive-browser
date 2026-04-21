FROM mcr.microsoft.com/playwright:v1.51.1-jammy
WORKDIR /app

COPY package.json tsconfig.json tsconfig.server.json next.config.js next-env.d.ts ./
RUN npm install

COPY pages ./pages
COPY components ./components
COPY server ./server
COPY styles ./styles
COPY .env.example ./
COPY README.md ./
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
