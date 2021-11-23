#!/usr/bin/env bash

docker run -v "$(pwd)/work:/asd" --init --rm --name asd-action ghcr.io/alps-asd/asd-action:latest --config=/asd/asd.xml /asd/profile.xml
