var PLAYER = require('../models/player');
var fs = require('fs');
var env = process.env.NODE_ENV || 'development';
var config = require('../config/config').setUpEnv(env).config();
var mongoose = require('mongoose');
var ASYNC = require('async');
mongoose.connect(config.db);

PLAYER.find({}, function(err, players) {
	var string = "{'players':[";
	ASYNC.forEach(players, function(player, innerCB) {
		var history = {};
		history.playerId = player.player_id;
		history.fantasyTeamId = player.history[0].fantasy_team;
		string += "{ 'mlbPlayerId':'" + history.playerId + "', 'fantasyTeamId':'" + history.fantasyTeamId + "'},";
		// var tempString = "UPDATE PLAYER set espnPlayerId={1} where mlbPlayerId={2}";
		// var name = player.name_display_first_last;
		// var espnId = player.espn_player_id;
		// if(name.indexOf("\'") > -1) {
		// 	//console.log(name);
		// 	name = name.replace("\'","\\\'");
		// 	//console.log(name);
		// }
		// var playerId = player.player_id ? player.player_id : -1;
		// if(playerId == -1) {
		// 	console.log("no mlbPlayerId for " + name);
		// } else {
		// 	tempString = tempString.replace("{1}", espnId);
		// 	tempString = tempString.replace("{2}", playerId);
		// 	tempString += ";\n";
		// 	string += tempString;
		// }
		// innerCB();
	});
	fs.writeFile('helloworld.txt', string, function (err) {
  		if (err) return console.log(err);
  		console.log('Hello World > helloworld.txt');
	});
});