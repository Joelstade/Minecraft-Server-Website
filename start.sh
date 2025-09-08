#!/bin/bash
set -e

PROJECT_NAME="my-node-app"
HOST_MOUNT_DIR="$HOME/docker-mounts/$PROJECT_NAME"
CONTAINER_PORT=443   # Use high port to avoid root requirement

# Create host folder for persistent downloads
mkdir -p "$HOST_MOUNT_DIR"
chmod 755 "$HOST_MOUNT_DIR"

# Remove any previous container
docker rm -f $PROJECT_NAME 2>/dev/null || true

# Build Docker image
docker build -t $PROJECT_NAME .

# Run container with host mount
docker run -d \
  --name $PROJECT_NAME \
  -v "$HOST_MOUNT_DIR:/usr/src/app/downloads" \
  -p $CONTAINER_PORT:$CONTAINER_PORT \
  $PROJECT_NAME

echo "Container $PROJECT_NAME is running. Downloads folder: $HOST_MOUNT_DIR"
