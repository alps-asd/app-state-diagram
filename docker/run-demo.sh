#!/usr/bin/env bash

cd "$(dirname "$0")" || exit

if [ ! -e profile.json ]; then
  curl https://koriym.github.io/app-state-diagram/blog/profile.json -O profile.json
fi

docker rm -f asd
docker run -dit --init --name asd app-state-diagram
docker cp ./profile.json asd:/asd/profile.json
docker exec -it asd composer global exec asd /asd/profile.json
docker cp asd:/asd .
