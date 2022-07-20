#!/usr/bin/env bash

cd "$(dirname "$0")"/.. || exit

docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/alps-asd/app-state-diagram:latest -f app-state-diagram/Dockerfile app-state-diagram
# docker scan app-state-diagram:latest
