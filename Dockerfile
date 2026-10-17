FROM node:22-alpine
WORKDIR /app
COPY web/package.json ./
RUN npm install
