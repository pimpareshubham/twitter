FROM node:16-alpine

WORKDIR /app

COPY backend/. .

RUN npm install

EXPOSE 5000

CMD node server.js
