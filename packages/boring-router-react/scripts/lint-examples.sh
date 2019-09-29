#!/bin/sh

for dirName in examples/*/
do
  yarn tslint --project "$dirName"
done
