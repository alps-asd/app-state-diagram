#!/usr/bin/env bash

dir=${1:-$(pwd)/work}
docker run -v "$(pwd)/work:/work" -it --init --rm --name asd -p 3000:3000 app-state-diagram:latest composer global exec asd -- --watch /work/profile.xml