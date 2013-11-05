var PLAYER = require('../models/player');
var mongoose = require('mongoose');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

PLAYER.find({}, function(err, players) {
	for(var i = 0; i < players.length; i++) {
		var player = players[i];
		player.history[1].fantasy_position = player.fantasy_position;
		console.log(player.name_display_first_last + ' ' + player.history[1].fantasy_position);
		player.save();
	}
});