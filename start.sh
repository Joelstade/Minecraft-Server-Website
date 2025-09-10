#!/bin/bash
set -e

# Start app + DB
docker compose up -d --build

echo "Minecraft-Server-Website stack is running 🎉"