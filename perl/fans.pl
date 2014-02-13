#!/usr/bin/perl

open FANGRAPHS, 'fans.csv';
open WRITER, '>writer2';
$count = 0;
@headers = [];
while(<FANGRAPHS>) {
	chomp;
	@attrs = split(/,/,$_);
	if($count == 0) {
		@headers = @attrs;
	}
	$len = @headers;
	@attrs[2] =~ s/"//g;
	if(@attrs[2] > 50) {
		print WRITER "db.batterProjections.update({";
		for($i = 0; $i < $len; $i++) {
			#remove quotation marks from all rows except header
			if($i != 0) {
				@attrs[$i] =~ s/"//g;
			}
			
			$header = @headers[$i];
			$attr = @attrs[$i];

			if($i == 0) {
				#"Name":"Miguel Cabrera",
				#print WRITER $header . ":" . $attr . ",";

				$header = substr(@headers[23],0,-1);
				$attr = substr(@attrs[23],0,-1);

				#"playerid":1744, stats: [ source:fans
				print WRITER $header . ":" . $attr . "},{\$push:{ stats: { source:'fans', ";
			} else {
				if($i == ($len - 1)) {
					print WRITER "}}});";
				} else {
					print WRITER $header . ":" . $attr;
				}
				if($i < ($len - 2)) {
					print WRITER ",";
				}
			}
		}
		#print WRITER "});";
		print WRITER "\n";
	}
	$count++;
}
close FANGRAPHS;
close WRITER;

