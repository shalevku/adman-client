#!/bin/bash

try="try"
original="original"

if [ -z $1 ]
then
  echo Please provide an action, i.e.: try or original
  exit 1
fi

if [ $1 = $try ]
then
  mv src "src original"
  mv "src try" src
  echo src is now try
elif [ $1 = $original ]
then
  mv src "src try"
  mv "src original" src
  echo src is now original 
else
  echo The aciton needs to be one of two: try or original only.
fi

# TODOs
# * Why I can't compare to a literal string directly in the test ([])?