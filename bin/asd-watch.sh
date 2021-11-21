#!/usr/bin/env bash

if [ $# != 1 ]; then
    echo usage: asd-watch {profile}
    echo @see https://github.com/koriym/app-state-diagram
    exit
fi

# shellcheck disable=SC2046
profile=$(cd $(dirname "$1") || exit; pwd)/$(basename "$1") # absolute path
dir=$(dirname "$profile")
basename=$(basename "$profile")
docker run -v "$dir:/work" -it --init --rm --name asd -p 3000:3000 app-state-diagram:latest composer global exec asd -- --watch /work/$basename
