#!/bin/sh

d=`date +%Y_%m_%d`
mongorestore --drop --port 27017 dbBackups/$d/dump/app18596138