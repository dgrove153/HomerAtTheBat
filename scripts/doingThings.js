var PLAYER = require('../models/player');
var fs = require('fs');
var env = process.env.NODE_ENV || 'development';
var config = require('../config/config').setUpEnv(env).config();
var mongoose = require('mongoose');
var ASYNC = require('async');
mongoose.connect(config.db);

PLAYER.find({}, function(err, players) {
	var string = "INSERT INTO PLAYER_TBL (name, mlbId) ";
	ASYNC.forEach(players, function(player, innerCB) {
		var name = player.name_display_first_last;
		if(name.indexOf("\'") > -1) {
			console.log(name);
			name = name.replace("\'","\''");
			console.log(name);
		}
		var playerId = player.player_id ? player.player_id : -1;
		string += "select '" + name + "', " + playerId + " union all \n";
		innerCB();
	});
	fs.writeFile('helloworld.txt', string, function (err) {
  		if (err) return console.log(err);
  		console.log('Hello World > helloworld.txt');
	});
});