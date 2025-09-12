FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

EXPOSE 80 443

CMD ["node", "server.js"]