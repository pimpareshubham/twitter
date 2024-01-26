FROM node:16-alpine
RUN mkdir node
COPY . ./node
WORKDIR /node
RUN npm install 
EXPOSE 5000
CMD node server.js