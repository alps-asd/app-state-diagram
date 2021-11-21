#!/usr/bin/env bash

if [ $# == 0 ]; then
    echo usage: asd profile
    echo @see https://github.com/koriym/app-state-diagram
    exit
fi

argc=$#
argv=${@:1:$((argc-1))}
lastv=${@:argc:1}

profile=$(cd "$(dirname "$lastv")" || exit; pwd)/$(basename "$lastv") # path/to/profile.xml (absolute path)
dir=$(dirname "$profile") # path/to
basename=$(basename "$profile") # profile.xml
docker run -v "$dir:/work" -it --init --rm --name asd -p 3000:3000 app-state-diagram:latest composer global exec asd -- "$argv" /work/"$basename"
