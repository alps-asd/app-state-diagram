#!/usr/bin/env bash

cd "$(dirname "$0")" || exit

../../docs/asd.sh --watch "$(pwd)"/work/profile.xml
