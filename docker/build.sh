#!/usr/bin/env bash

cd "$(dirname "$0")"/.. || exit

docker build -t app-state-diagram:latest -f docker/Dockerfile .
# docker scan app-state-diagram:latest
