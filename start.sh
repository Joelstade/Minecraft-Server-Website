#!/bin/bash
set -e

# Create necessary host directories
mkdir -p downloads db-init certs

# Get host UID/GID for Docker
export MY_UID=$(id -u)
export MY_GID=$(id -g)

echo "Starting Minecraft-Server-Website stack..."
docker compose up -d --build --remove-orphans
echo "✅ Stack is running!"

# Optional: check environment variables in the scan container
docker exec -it my-file-scanner sh -c "env | grep DATABASE_URL"