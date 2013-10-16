#!/usr/bin/perl

package Person;
sub new {
    my $self = {
        Name => undef,
        Team => undef,
	draftedTeam => '',
	wasFA => 0,
	lastTransaction => undef,
	keeperYear2013 => 0,
	salary2013 => 0,
	month => undef,
	day => undef,
	minorLeaguer => 0,
	draftRound => 0,
	draftPick => 0,
	draftYear => 0,
	position => undef,
    };
    bless $self, 'Person';
    return $self;
}

sub addPlayer {
	$team = $_[0];
	$name = $_[1];
	$month = $_[2];
	$day = $_[3];
	$position = $_[4];
	if(exists $playerHash{$name}) {
		$playerHash{$name}->{Team} = $team;	
		$playerHash{$name}->{wasFA} = 1;							
	} else {
		$player = new Person();
		$player->{Name} = $name;
		$player->{Team} = $team;
		$player->{wasFA} = 1;
		$player->{month} = $month;
		$player->{day} = $day;
		$player->{position} = $position;
		$playerHash{$name} = $player;
	}
}

sub dropPlayer {
	$name = $_[0];
	$month = $_[1];
	$day = $_[2];
	$position = $_[3];
	if(exists $playerHash{$name}) {
		$playerHash{$name}->{Team} = "FA";
		$playerHash{$name}->{wasFA} = 1;
		$playerHash{$name}->{month} = $month;
		$playerHash{$name}->{day} = $day;
	} else {
		$player = new Person();
		$player->{Name} = $name;
		$player->{Team} = "FA";
		$player->{wasFA} = 1;
		$player->{position} = $position;
		$playerHash{$name} = $player;
	}
}

%playerHash = ();

open DRAFT, '../textFiles/draft';
while(<DRAFT>) {
	chomp;
	@players = split(/playerId/, $_);
	$teamName = "";
	foreach(@players) {
		$_ =~ m/>([A-Za-z \.,\-'\+]*)<\/a>/;
		$name = $1;
		$name =~ s/\*//;
		$name =~ s/'/\\'/;
		$isTeamName = index($_, 'target="_top"');
		if($isTeamName > 0) {
			$teamName = $name;
		}
		$_ =~ m/>\$([0-9]+)</;
		$price = $1;

		$_ =~ m/&nbsp;([A-Z0-9]+)/;
		$position = $1;

		$keeper = 0;
		if(index($_, 'color:blue;">K') > 0) {
			$keeper = 1;
		}

		if($isTeamName < 0 && $name ne "") {
			if(exists $playerHash{$name}) {
				$playerHash{$name}->{salary2013} = $price;
			} else {
				$player = new Person();
				$player->{Name} = $name;
				$player->{Team} = $teamName;
				$player->{draftedTeam} = $teamName;
				$player->{wasFA} = 0;
				$player->{salary2013} = $price;
				$player->{position} = $position;
				if($price != 0) {
					$playerHash{$name} = $player;
					$playerHash{$name}->{draftYear} = 2013;
					if($keeper == 1) {
						$playerHash{$name}->{keeperYear2013} = 1;
					}
				}
			}
		}
	}
}
close TRANS;

open TRANS, '../textFiles/allTrans';
$count = 0;
while(<TRANS>) {
	chomp;
	@wrongOrderTransactions = split(/<tr/, $_);
	@transactions = reverse(@wrongOrderTransactions);
	foreach(@transactions) {  
		@elements = split(/<td/, $_);
		$date = $elements[1];
		$date =~ m/([A-Za-z][a-z][a-z]), ([A-Z][a-z][a-z]) ([0-9]{1,2})<br>(1?[0-9]:1?[0-9]+ [APM]+)/;
		$month = $2;
		$day = $3;
		$time = $4;

		$moves = $elements[3];
		if($moves !~ m/Updated transaction counters/) {
			@multiMoves = split(/<br>/, $moves);
			foreach(@multiMoves) {
				$_ =~ m/([A-Z+]+) (added|dropped|traded) <b>([A-Za-z *\.,\-']+)/;
				$team = $1;
				$tranType = $2;
				$player = $3; 
				$player =~ s/\*//;
				$player =~ s/'/\\'/;
				$playerName = $player;
				
				$_ =~ m/ (SP|RP|C|1B|2B|3B|SS|MI|CI|OF|U|DH) /;
				$position = $1;

				if($tranType eq "added") {
					addPlayer($team, $player, $month, $day, $position);
					if($playerHash{$playerName}->{salary2013} == 0) {
						#$playerHash{$playerName}->{salary2013} = 3;
					}
				} elsif($tranType eq "dropped") {
					dropPlayer($player, $month, $day, $position);
				} elsif($tranType eq "traded") {
					$_ =~ m/to ([A-Z+]+)/;
					$newTeam = $1;
					if(exists $playerHash{$player}) {
						$playerHash{$player}->{Team} = $newTeam;
					}	
				}
			}
		}
	}
}
close TRANS;


open ML, '../textFiles/minorLeaguers';
$count = 0;
while(<ML>) {
	chomp;
	@arr = split(/,/,$_);
	$name = $arr[0];
	$name =~ s/'/\\'/;
	$draftTeam = $arr[1];
	$endTeam = $arr[2];
	$minorLeaguer = $arr[3];
	$draftRound = $arr[4];
	$draftPick = $arr[5];
	$draftYear = $arr[6];
	$position = $arr[7];
	if(exists $playerHash{$name}) {
		if($playerHash{$name}->{Team} ne $endTeam) {
			#print "$name $endTeam but transactions found $playerHash{$name}->{Team}\n";
		}
		#print "$name was in transactions\n";
	} else {
		addPlayer($endTeam, $name);
	}
	$playerHash{$name}->{draftedTeam} = $draftTeam;
	$playerHash{$name}->{minorLeaguer} = $minorLeaguer;
	$playerHash{$name}->{draftRound} = $draftRound;
	$playerHash{$name}->{draftPick}	= $draftPick;		
	$playerHash{$name}->{draftYear} = $draftYear;
	$playerHash{$name}->{position} = $position;
}
close ML;

open WRITER, '>../scripts/players_2.js';
#print WRITER "db.players.remove();\n";
print WRITER "module.exports = [";
foreach $_ (sort keys %playerHash) {
	print WRITER "{ ";
	print WRITER "fantasy_team:'$playerHash{$_}->{Team}',";
	print WRITER "name_display_first_last:'$playerHash{$_}->{Name}',";
	print WRITER "keeperYear2013:$playerHash{$_}->{keeperYear2013},"; 
	print WRITER "salary2013:$playerHash{$_}->{salary2013},";
	print WRITER "minorLeaguer:$playerHash{$_}->{minorLeaguer},";
	print WRITER "draftedTeam:'$playerHash{$_}->{draftedTeam}',";
	#print WRITER "draftRound:'$playerHash{$_}->{draftRound}',";
	#print WRITER "draftPick:'$playerHash{$_}->{draftPick}',";
	print WRITER "draftYear:'$playerHash{$_}->{draftYear}',";
	#print WRITER "position:'$playerHash{$_}->{position}',";
	#print WRITER "isKeeper2014:0,";
	print WRITER " },\n";
};
print WRITER "]";
#Player Deletes
#print WRITER "db.players.remove({ playerName: 'Omar Vizquel', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Tony Zych', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Matt Daley', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Jason Varitek', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Kris Benson', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Victor Zambrano', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Kerry Wood', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Jon Weber', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Tommy Kahnle', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Jessie Litsch', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Angelo Gumbs', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Eric Hurley', minorLeaguer: 0});\n";
#print WRITER "db.players.remove({ playerName: 'Cory Arbiso', minorLeaguer: 0});\n";

#Lock ups
#print WRITER "db.players.update({ playerName: 'Felix Hernandez'}, { \$set: {lockedUp : { yearsRemaining: 2, salary: 32 }}});\n";
#print WRITER "db.players.update({ playerName: 'Robinson Cano'}, { \$set: {lockedUp : { yearsRemaining: 2, salary: 43 }}});\n";
#print WRITER "db.players.update({ playerName: 'Giancarlo Stanton'}, { \$set: {lockedUp : { yearsRemaining: 2, salary: 30 }}});\n";
close WRITER;
