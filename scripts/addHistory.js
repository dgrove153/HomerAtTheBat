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

/*
Player.find({'history.1':{$exists:false}}, function(err, docs) {
	for(var i = 0; i < docs.length; i++) {
		var player = docs[i];
		var newHistory = { year: 2014 };
		player.history.unshift(newHistory);
		player.save();
	}
});
*/


Player.find({name_display_first_last:'Julio Urias'}, function(err, docs) {
	for(var i = 0; i < docs.length; i++) {
		var player = docs[i];
		var year2013 = player.history[0];
		var year2014 = player.history[1];
		player.history = [ year2014, year2013 ];
		player.save();
	}
});


