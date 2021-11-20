#!/usr/bin/env bash

cd "$(dirname "$0")"/.. || exit

docker build -t app-state-diagram:latest -f app-state-diagram/Dockerfile .
# docker scan app-state-diagram:latest
