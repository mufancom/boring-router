#!/bin/sh

for dirName in examples/*/
do
  yarn tsc --project "$dirName"
done
