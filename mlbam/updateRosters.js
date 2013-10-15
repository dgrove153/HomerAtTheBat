var http = require('http');

var teams = [{ team_id: 108, team_code: 'ana', club_full_name : 'Los Angeles Angels' }
{ team_id: 109, team_code: 'ari', club_full_name : 'Arizona Diamondbacks' }
{ team_id: 144, team_code: 'atl', club_full_name : 'Atlanta Braves' }
{ team_id: 110, team_code: 'bal', club_full_name : 'Baltimore Orioles' }
{ team_id: 111, team_code: 'bos', club_full_name : 'Boston Red Sox' }
{ team_id: 112, team_code: 'chn', club_full_name : 'Chicago Cubs' }
{ team_id: 113, team_code: 'cin', club_full_name : 'Cincinnati Reds' }
{ team_id: 114, team_code: 'cle', club_full_name : 'Cleveland Indians' }
{ team_id: 115, team_code: 'col', club_full_name : 'Colorado Rockies' }
{ team_id: 145, team_code: 'cha', club_full_name : 'Chicago White Sox' }
{ team_id: 116, team_code: 'det', club_full_name : 'Detroit Tigers' }
{ team_id: 117, team_code: 'hou', club_full_name : 'Houston Astros' }
{ team_id: 118, team_code: 'kca', club_full_name : 'Kansas City Royals' }
{ team_id: 119, team_code: 'lan', club_full_name : 'Los Angeles Dodgers' }
{ team_id: 146, team_code: 'mia', club_full_name : 'Miami Marlins' }
{ team_id: 158, team_code: 'mil', club_full_name : 'Milwaukee Brewers' }
{ team_id: 142, team_code: 'min', club_full_name : 'Minnesota Twins' }
{ team_id: 121, team_code: 'nyn', club_full_name : 'New York Mets' }
{ team_id: 147, team_code: 'nya', club_full_name : 'New York Yankees' }
{ team_id: 133, team_code: 'oak', club_full_name : 'Oakland Athletics' }
{ team_id: 143, team_code: 'phi', club_full_name : 'Philadelphia Phillies' }
{ team_id: 134, team_code: 'pit', club_full_name : 'Pittsburgh Pirates' }
{ team_id: 135, team_code: 'sdn', club_full_name : 'San Diego Padres' }
{ team_id: 136, team_code: 'sea', club_full_name : 'Seattle Mariners' }
{ team_id: 137, team_code: 'sfn', club_full_name : 'San Francisco Giants' }
{ team_id: 138, team_code: 'sln', club_full_name : 'St. Louis Cardinals' }
{ team_id: 139, team_code: 'tba', club_full_name : 'Tampa Bay Rays' }
{ team_id: 140, team_code: 'tex', club_full_name : 'Texas Rangers' }
{ team_id: 141, team_code: 'tor', club_full_name : 'Toronto Blue Jays' }
{ team_id: 120, team_code: 'was', club_full_name : 'Washington Nationals' }];

var updateMLBRosters = function(req, res) {
	var output = {};
	for(var i = 0; i < teams.length; i++) {
		var teamId = teams[i].team_id;
		http.get('http://mlb.mlb.com/lookup/json/named.roster_40.bam?team_id=' + teamId, function(response) {
			var output = '';
			var obj;
			response.on('data', function(chunk) {
				output += chunk;
			});
			response.on('end', function() {
				var json = JSON.parse(output);
			});
		});
	}
}
