FROM node:18-alpine

WORKDIR /usr/src/app

# Create downloads folder
RUN mkdir -p /usr/src/app/downloads && chown node:node /usr/src/app/downloads

COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 883

# Run app
CMD ["node", "server.js"]