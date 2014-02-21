var PLAYER = require("../../../models/player");
var MLB = require("../../../external/mlb");
var UTIL = require("../../../application/util");
var ASYNC = require('async');

exports.createPlayerWithMLBId = function(playerId, fantasyProperties, addDropProperties, history, callback) {
	MLB.getMLBProperties(playerId, function(mlbProperties) {
		if(mlbProperties == undefined) {
			callback(undefined);
		} else {
			PLAYER.createNewPlayer(mlbProperties, fantasyProperties, addDropProperties, history, callback);
		}
	});
}

//Update a player's MLB properties given mlb player id 
var updatePlayer = function(mlbProperties, callback) {
	PLAYER.findOne({ player_id : mlbProperties.player_id }, function(err, player) {
		if(!player) {
			callback(undefined);
			return;
		}
		for (var property in mlbProperties) {
			if (mlbProperties.hasOwnProperty(property)) {
				if(property == 'status_code') {
					player[property] = UTIL.positionToStatus(mlbProperties[property]);
				} else {
					player[property] = mlbProperties[property];
				}
	    	}
		}	
		player.save();
		callback(player);
	});
}

exports.updatePlayer = updatePlayer;

//Update MLB properties
//If no playerId supplied, updates all players
exports.update = function(callback, playerId) {
	var count = 0;
	var search = {};
	if(playerId) {
		search.player_id = playerId;
	}
	var count = 0;
	PLAYER.find(search, function(err, players) {
		ASYNC.forEach(players, function(player, cb) {
			if(player.player_id != undefined) {
				console.log("updating " + player.name_display_first_last);
				MLB.getMLBProperties(player.player_id, function(mlbPlayer) {
					updatePlayer(mlbPlayer, function(savedPlayer) {
						if(savedPlayer) {
							console.log("saved " + savedPlayer.name_display_first_last);
							count++;
						}
						cb();
					});
				});
			} else {
				cb();
			}
		}, function() {
			callback(count);	
		});
	});
}

//Add players from 40-man roster to database
exports.update40ManRosters = function(callback) {
	MLB.lookupAllRosters(callback, function(player, cb) {
		PLAYER.findOne({ player_id : player.player_id }, function(err, dbPlayer) {
			if(!dbPlayer) {
				PLAYER.createNewPlayer(player, undefined, undefined, undefined, function(newPlayer) {
					console.log("new player: " + newPlayer.name_display_first_last);
					cb();
				});
			} else {
				console.log(dbPlayer.name_display_first_last + " already exists");
				cb();
			}
		});
	});
}