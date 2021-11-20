#!/usr/bin/env bash

cd "$(dirname "$0")"/.. || exit

docker build -t asd-action:latest -f asd-action/Dockerfile .
# docker scan asd-action:latest
