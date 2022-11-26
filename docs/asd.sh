#!/usr/bin/env bash

if [ $# == 0 ]; then
    echo usage: asd [options] alps_file
    echo @see https://github.com/alps-asd/app-state-diagram#usage
    exit
fi

argc=$#
options=${*:1:$((argc-1))}
target=${*:argc:1}

while [[ $# -gt 0 ]]; do
  case $1 in
    --port=*) ARG="$1"; PORT+=("${ARG#*=}"); unset ARG; shift;;
    *) shift;;
  esac
done

profile=$(cd "$(dirname "$target")" || exit; pwd)/$(basename "$target") # path/to/profile.xml (absolute path)
dir=$(dirname "$profile") # path/to
basename=$(basename "$profile") # profile.xml

docker pull ghcr.io/alps-asd/app-state-diagram:latest
docker run --env COMPOSER_PROCESS_TIMEOUT=0 -v "$dir:/work" -it --init --rm -p ${port}:${port} ghcr.io/alps-asd/app-state-diagram composer global exec asd -- "$options" /work/"$basename"
