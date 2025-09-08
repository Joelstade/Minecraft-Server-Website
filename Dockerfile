# Use Node.js LTS base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package files first (for caching dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your source code
COPY . .

# Expose port (adjust if your app uses a different one)
EXPOSE 443

# Command to run your app
CMD ["npm", "start"]