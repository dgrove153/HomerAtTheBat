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
			//console.log("Couldn't find " + player.name_display_first_last);
		} else {
			//update player
			//console.log(player);
			playerFromDB.fantasy_team = player.fantasy_team;
			var keeperTeam = player.keeperYear2013 == 1 ? player.draftedTeam : '';
			var minorLeaguer = player.minorLeaguer == 1 ? 'true' : 'false';
			var history = { year: 2013, draft_team: player.draftedTeam, keeper_team: keeperTeam, minor_leaguer : minorLeaguer, salary : player.salary2013, 
				contract_year : player.keeperYear2013 };
			playerFromDB.history = [];
			playerFromDB.history.push(history);
			playerFromDB.save();
			//console.log("Put " + player.name_display_first_last + " on " + player.fantasy_team);
			console.log(player.name_display_first_last);
			console.log(history);
		}
	});	
};

for(var i = 0; i < data.length; i++) {
	//console.log(data[i]);
	processFile(data[i]);
}
