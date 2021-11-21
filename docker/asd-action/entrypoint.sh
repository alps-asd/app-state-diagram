#!/bin/sh -l

dirname=$(dirname $2)
/vendor/bin/asd --config=$1 $2
if [ $? -ne "0" ]; then
  echo "ASD error"
  exit 1
else
  echo "Output Directory: $dirname"
  echo "::set-output name=dir::$dirname"
fi
