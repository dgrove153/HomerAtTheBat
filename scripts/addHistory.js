var Player = require('../models/player');
var mongoose = require('mongoose');
//Environment variables
var 	env = process.env.NODE_ENV || 'development';
var 	config = require('../config/config').setUpEnv(env).config();

//Database connection
mongoose.connect(config.db);

Player.find({}, function(err, docs) {
	for(var i = 0; i < docs.length; i++) {
		var player = docs[i];
		console.log("Working on " + player.name_display_first_last);
		if(player.historicalTeamByDate == undefined) {
			player.historicalTeamByDate = [];
		}
		if(player.teamByDate != undefined) {
			player.teamByDate.forEach(function(tbd) {
				player.historicalTeamByDate.push(tbd);
			});
			player.teamByDate = [];
		}
		player.save();
	}
});


