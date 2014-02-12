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
	if(@attrs[1] > 600) {
		print WRITER "db.draftProjections.insert({";
		for($i = 0; $i < $len; $i++) {
			if($i != 0) {
				@attrs[$i] =~ s/"//g;
			}
			chomp @headers[$i];
			chomp @attrs[$i];
			$header = @headers[$i];
			$attr = @attrs[$i];
			if($i == ($len - 1)) {
				$header = substr(@headers[$i],0,-1);
				$attr = substr(@attrs[$i],0,-1);
			}
			print WRITER $header . ":" . $attr;
			if($i != ($len - 1)) {
				print WRITER  ",";
			}
		}
		print WRITER "});";
		print WRITER "\n";
	}
	$count++;
}
close FANGRAPHS;
close WRITER;

