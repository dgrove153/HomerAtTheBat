var Player = require('./models/player');
var http = require('http');
var mongoose = require('mongoose');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('./config/config')[env];

//Database connection
mongoose.connect(config.db);

/*
var teams = [{ team_id:116, name_display_full: "Detroit Tigers"},
{ team_id:120, name_display_full: "Washington Nationals"},
{ team_id:111, name_display_full: "Boston Red Sox"},
{ team_id:114, name_display_full: "Cleveland Indians"},
{ team_id:117, name_display_full: "Houston Astros"},
{ team_id:119, name_display_full: "Los Angeles Dodgers"},
{ team_id:137, name_display_full: "San Francisco Giants"},
{ team_id:140, name_display_full: "Texas Rangers"},
{ team_id:143, name_display_full: "Philadelphia Phillies"},
{ team_id:145, name_display_full: "Chicago White Sox"},
{ team_id:158, name_display_full: "Milwaukee Brewers"},
{ team_id:135, name_display_full: "San Diego Padres"},
{ team_id:136, name_display_full: "Seattle Mariners"},
{ team_id:139, name_display_full: "Tampa Bay Rays"},
{ team_id:141, name_display_full: "Toronto Blue Jays"},
{ team_id:142, name_display_full: "Minnesota Twins"},
{ team_id:144, name_display_full: "Atlanta Braves"},
{ team_id:146, name_display_full: "Miami Marlins"},
{ team_id:118, name_display_full: "Kansas City Royals"},
{ team_id:133, name_display_full: "Oakland Athletics"},
{ team_id:121, name_display_full: "New York Mets"},
{ team_id:138, name_display_full: "St. Louis Cardinals"},
{ team_id:147, name_display_full: "New York Yankees"},
{ team_id:109, name_display_full: "Arizona Diamondbacks"},
{ team_id:108, name_display_full: "Los Angeles Angels"},
{ team_id:110, name_display_full: "Baltimore Orioles"},
{ team_id:112, name_display_full: "Chicago Cubs"},
{ team_id:113, name_display_full: "Cincinnati Reds"},
{ team_id:115, name_display_full: "Colorado Rockies"},
{ team_id:134, name_display_full: "Pittsburgh Pirates"}];
*/

var ari = function(myVar) {
	for(var i = 0; i < myVar.roster_40.queryResults.row.length; i++) {
		var jsonPlayer = myVar.roster_40.queryResults.row[i];
		var result = Player.findByName(jsonPlayer, function(player, json) {
			if(!player) {
				//create player
				var p = new Player(json);
				p.save(function(err) {
					if(err) console.log(err);
				});
				console.log("Created player: " + json.name_display_first_last);
			} else {
				//update player
				//player.history[0].year=2015;
				//player.save();
				console.log("Updated player: " + player.name_display_first_last);
			}
		});
	}
};

for(var j = 0; j< teams.length; j++) {
	http.get('http://mlb.mlb.com/lookup/json/named.roster_40.bam?team_id=' + teams[j].team_id, function(res) {
		var output = '';
		res.on('data', function(chunk) {
			output += chunk;
		});
		res.on('end', function() {
			var json = JSON.parse(output);
			ari(json);
		});
	});
}

