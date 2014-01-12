var Player = require('../models/player');
var http = require('http');
var mongoose = require('mongoose');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

var teams = [

{ team_id: 108, team_code: 'ana', club_full_name : 'Los Angeles Angels' },
{ team_id: 109, team_code: 'ari', club_full_name : 'Arizona Diamondbacks' },
{ team_id: 144, team_code: 'atl', club_full_name : 'Atlanta Braves' },
{ team_id: 110, team_code: 'bal', club_full_name : 'Baltimore Orioles' },
{ team_id: 111, team_code: 'bos', club_full_name : 'Boston Red Sox' },
{ team_id: 112, team_code: 'chn', club_full_name : 'Chicago Cubs' },
{ team_id: 113, team_code: 'cin', club_full_name : 'Cincinnati Reds' },
{ team_id: 114, team_code: 'cle', club_full_name : 'Cleveland Indians' },
{ team_id: 115, team_code: 'col', club_full_name : 'Colorado Rockies' },
{ team_id: 145, team_code: 'cha', club_full_name : 'Chicago White Sox' },
{ team_id: 116, team_code: 'det', club_full_name : 'Detroit Tigers' },
{ team_id: 117, team_code: 'hou', club_full_name : 'Houston Astros' },
{ team_id: 118, team_code: 'kca', club_full_name : 'Kansas City Royals' },
{ team_id: 119, team_code: 'lan', club_full_name : 'Los Angeles Dodgers' },
{ team_id: 146, team_code: 'mia', club_full_name : 'Miami Marlins' },
{ team_id: 158, team_code: 'mil', club_full_name : 'Milwaukee Brewers' },
{ team_id: 142, team_code: 'min', club_full_name : 'Minnesota Twins' },
{ team_id: 121, team_code: 'nyn', club_full_name : 'New York Mets' },
{ team_id: 147, team_code: 'nya', club_full_name : 'New York Yankees' },
{ team_id: 133, team_code: 'oak', club_full_name : 'Oakland Athletics' },
{ team_id: 143, team_code: 'phi', club_full_name : 'Philadelphia Phillies' },
{ team_id: 134, team_code: 'pit', club_full_name : 'Pittsburgh Pirates' },
{ team_id: 135, team_code: 'sdn', club_full_name : 'San Diego Padres' },
{ team_id: 136, team_code: 'sea', club_full_name : 'Seattle Mariners' },
{ team_id: 137, team_code: 'sfn', club_full_name : 'San Francisco Giants' },
{ team_id: 138, team_code: 'sln', club_full_name : 'St. Louis Cardinals' },
{ team_id: 139, team_code: 'tba', club_full_name : 'Tampa Bay Rays' },
{ team_id: 140, team_code: 'tex', club_full_name : 'Texas Rangers' },
{ team_id: 141, team_code: 'tor', club_full_name : 'Toronto Blue Jays' },
{ team_id: 120, team_code: 'was', club_full_name : 'Washington Nationals' }
];

var tranType = {};
tranType.moved = 1;
tranType.added = 2;
tranType.dropped = 3;
tranType.traded = 4;
tranType.drafted = 5;
	
// for(var j = 0; j< teams.length; j++) {
// 	console.log('getting team ' + teams[j].club_full_name);
// 	http.get('http://mlb.mlb.com/lookup/json/named.roster_40.bam?team_id=' + teams[j].team_id, function(res) {
// 		var output = '';
// 		res.on('data', function(chunk) {
// 			output += chunk;
// 		});
// 		res.on('end', function() {
// 			var json = JSON.parse(output);
// 			var playerList = json.roster_40.queryResults.row;
// 			for(var i = 0; i < playerList.length; i++) {
// 				ari(playerList[i]);
// 			}
// 		});
// 	});
// }

var parseFunc = function(err, dom) {
	var row = SELECT(dom, '.tableBody');
	for(var j = 0; j < row[0].children.length; j++) {
		if(row[0].children[j].name == 'tr') {
			var k = row[0].children[j].children[2].children;
			if(k) {
				for(var i = 0; i < k.length; i = i + 4) {
					var action = k[i].data.split(' ');
					var team = action[0];
					var move = action[1];
					var name = k[i + 1].children[0].data;
					var text = k[i+2].data;
					console.log(team + " " + move + " " + name + " " + text);
					// if(!k[i].name) {
					// 	console.log(i + " ");
					// 	console.log(k[i]);
					// }
					// console.log("\n");
					// console.log(i + ":\t");
					// console.log(k[i]);
				}
			}
		}
	}
};
var url = 'http://games.espn.go.com/flb/recentactivity?leagueId=216011&seasonId=2013&activityType=2&startDate=20140108&endDate=20140108&teamId=-1&tranType=' + 
	tranType.dropped;
console.log(url);

http.get(
	url,
	function(res) {
		var data;
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function() {
			var handler = new HTMLPARSE.DefaultHandler(parseFunc);
			var parser = new HTMLPARSE.Parser(handler);
			parser.parseComplete(data);
		});
	}
);

// http://games.espn.go.com/flb/recentactivity?leagueId=216011&seasonId=2013&activityType=2&startDate=20140108&endDate=20140108&teamId=-1&tranType=1
// http://games.espn.go.com/flb/recentactivity?leagueId=216011&seasonId=2013&activityType=2&startDate=20140108&endDate=20140108&teamId=-1&tranType=-1
