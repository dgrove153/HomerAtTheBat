#!/usr/bin/perl

open FANGRAPHS, 'fangraphs.csv';
open WRITER, '>writer';
$count = 0;
@headers = [];
while(<FANGRAPHS>) {
	chomp;
	@attrs = split(/,/,$_);
	if($count == 0) {
		@headers = @attrs;
	}
	$len = @headers;
	@attrs[1] =~ s/"//g;
	if(@attrs[1] > 50) {
		print WRITER "db.draftProjections.insert({";
		for($i = 0; $i < $len; $i++) {
			#remove quotation marks from all rows except header
			if($i != 0) {
				@attrs[$i] =~ s/"//g;
			}
			
			$header = @headers[$i];
			$attr = @attrs[$i];

			if($i == 0) {
				#"Name":"Miguel Cabrera",
				print WRITER $header . ":" . $attr . ",";

				$header = substr(@headers[22],0,-1);
				$attr = substr(@attrs[22],1,-2);

				#"playerid":1744, stats: [ source:steamer
				print WRITER $header . ":" . $attr . ", stats: [ source:'steamer', ";
			} else {
				if($i == ($len - 1)) {
					print WRITER "]});";
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

