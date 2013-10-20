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
				console.log(player.name_display_first_last + " is a FA, ignoring");
			} else {
				var p = new Player(player);
				p.save();

			}
		} else {
			//update player
			//console.log(player);
			playerFromDB.fantasy_team = player.fantasy_team;
			playerFromDB.history[0].keeper_team = player.history[0].keeper_team;
			playerFromDB.history[0].draft_team = player.history[0].draft_team;
			playerFromDB.history[0].minor_leaguer = player.history[0].minor_leaguer;
			playerFromDB.history[0].salary = player.history[0].salary;
			playerFromDB.history[0].contract_year = player.history[0].contract_year;
			//console.log(player.name_display_first_last);
			//console.log(playerFromDB.history);
			//playerFromDB.history = [];
			//playerFromDB.history.push(history);
			playerFromDB.save();
			//console.log("Put " + player.name_display_first_last + " on " + player.fantasy_team);
		}
	});	
};

for(var i = 0; i < data.length; i++) {
	//console.log(data[i]);
	processFile(data[i]);
}
