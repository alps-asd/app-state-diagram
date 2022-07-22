#!/usr/bin/env bash

cd "$(dirname "$0")"/.. || exit

docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/alps-asd/asd-action:latest -f asd-action/Dockerfile asd-action
# docker scan asd-action:latest
