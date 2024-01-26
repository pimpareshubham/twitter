# FROM node:16-alpine
# RUN mkdir node
# COPY . ./node
# WORKDIR /node
# RUN npm install 
# EXPOSE 5000
# CMD node server.js

# Use the official Node.js image as the base image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the app runs on
EXPOSE 5000

# Define the command to run the application
CMD ["node", "server.js"]
