FROM node:18-alpine

WORKDIR /usr/src/app

# Downloads folder
RUN mkdir -p /usr/src/app/downloads

COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 883

CMD ["node", "server.js"]
