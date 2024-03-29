#!/usr/bin/env bash

cd "$(dirname "$0")" || exit

workdir="asd-$(date +'%Y%m%d%H%M%S')"
mkdir "${workdir}"
curl -s https://alps-asd.github.io/app-state-diagram/blog/profile.json -o "${workdir}/profile.json"

docker run -v "$(pwd)/${workdir}:/asd" -dit --init --rm --name asd app-state-diagram composer --quiet global exec asd /asd/profile.json
