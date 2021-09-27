#!/usr/bin/env bash

cd "$(dirname "$0")" || exit

curl https://koriym.github.io/app-state-diagram/blog/profile.json -O profile.json

docker run -dit --init --name asd app-state-diagram
docker cp ./profile.json asd:/tmp/profile.json
docker exec -it asd composer global exec asd /tmp/profile.json
