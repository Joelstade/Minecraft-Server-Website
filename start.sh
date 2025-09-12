#!/bin/bash
set -e

# Make sure this file has LF line endings
# If not: dos2unix start.sh

npm install cookie-parser
npm install cors

# Get host UID/GID without exporting readonly UID/GID
export MY_UID=$(id -u)
export MY_GID=$(id -g)

echo "Starting Minecraft-Server-Website stack..."
docker compose up -d --build --remove-orphans
echo "✅ Stack is running!"