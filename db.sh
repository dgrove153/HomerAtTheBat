#!/bin/sh
cd dbBackups;
d=`date +%Y_%m_%d`
echo $d;
if [ -d "$d" ]; then
	cd $d;
	echo "Delete today's old backup?";
	read answer;
	if [ "$answer" == "n" ]; then
		tim=`date +%H_%M_%S`
		mv dump "dump_$tim";
	else
		rm -r dump;
	fi
else
  	mkdir $d;
  	echo "made directory $d";
  	cd $d;
fi
mongodump -h paulo.mongohq.com:10004 -d app18596138 -u ari -password ari;