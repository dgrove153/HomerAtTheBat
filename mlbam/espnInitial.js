var Player = require('../models/player');
var http = require('http');
var mongoose = require('mongoose');
var fs = require('fs');
var data = require('../scripts/players_2.js');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

var content;

var updatePlayer = function(player) {
	
};

var processFile = function(player) {
	Player.findOne({ name_display_first_last: player.name_display_first_last}, function(err, playerFromDB) {
		if(err) throw err;
		if(!playerFromDB) {
			//create player
			//var p = new Player(jsonPlayer);
			//p.save(function(err) {
			//	if(err) console.log(err);
			//});
			if(player.fantasy_team == 'FA') {
				console.log("Couldn't find " + player.name_display_first_last);
			}
		} else {
			//update player
			//console.log(player);
			playerFromDB.fantasy_team = player.fantasy_team;
			var keeperTeam = player.keeperYear2013 == 1 ? player.draftedTeam : '';
			var minorLeaguer = player.minorLeaguer == 1 ? 'true' : 'false';
			playerFromDB.history[0].keeper_team = keeperTeam;
			playerFromDB.history[0].draft_team = player.draftedTeam;
			playerFromDB.history[0].minor_leaguer = minorLeaguer;
			playerFromDB.history[0].salary = player.salary2013;
			playerFromDB.history[0].contract_year = player.keeperYear2013;
			//console.log(player.name_display_first_last);
			//console.log(playerFromDB.history);
			//playerFromDB.history = [];
			//playerFromDB.history.push(history);
			//playerFromDB.save();
			//console.log("Put " + player.name_display_first_last + " on " + player.fantasy_team);
		}
	});	
};

for(var i = 0; i < data.length; i++) {
	//console.log(data[i]);
	processFile(data[i]);
}
