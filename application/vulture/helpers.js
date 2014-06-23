var ASYNC = require('async');
var PLAYER = require("../../models/player");
var PLAYERMLB = require('../../application/player/update/mlb');
var PLAYERESPN = require('../../application/player/update/espn');
var CONFIG = require('../../config/config').config();

var canPlayerBeVultured = function(player, callback) {
	var historyIndex = player.findHistoryIndex(CONFIG.year);
	var statsIndex = player.findStatsIndex(CONFIG.year);

	var isOnATeam = player.history[historyIndex] && player.history[historyIndex].fantasy_team != 0;
	if(isOnATeam) {
		var alreadyVultured = player.vulture && player.vulture.is_vultured;
		if(alreadyVultured) {
			callback(false, player.name_display_first_last + " is already vultured");
		} else if(player.status_code != player.fantasy_status_code) {
			if(player.history[historyIndex].minor_leaguer) {
				callback(false, player.name_display_first_last + " is a minor leaguer and cannot be vultured");
			} else {
				callback(true);
			}
		} else {
			callback(false);
		}
	} else {
		callback(false);
	}
}

var isVultureLegal = function(vulture_pid, giving_up_pid, callback) {
	PLAYER.findOne({ _id : vulture_pid }, function(err, vulturePlayer) {
		canPlayerBeVultured(vulturePlayer, function(isVulturable, message) {
			if(isVulturable) {
				PLAYER.findOne({ _id : giving_up_pid }, function(err, givingUpPlayer) {
					canPlayerBeUsedInVulture(givingUpPlayer, function(isUsable, message) {
						if(isUsable) {
							callback(true);
						} else {
							callback(false, giving_up_pid, message);
						}
					});
				});
			} else {
				callback(false, vulture_pid, message);
			}
		});
	});
}

var canPlayerBeUsedInVulture = function(player, callback) {
	if(player.vulture) {
		if(player.vulture.is_vultured) {
			return callback(false, player.name_display_first_last + " is being vultured, select a different player");
		} else if(player.vulture.vultured_for_id) {
			return callback(false, player.name_display_first_last + " is already being used in a vulture");
		} else {
			return callback(true);
		}
	} else {
		return callback(true);
	}
}

var sendMessage = function(io, user, player_id, message) {
	if(io) {
		io.sockets.in(user.team).emit('message', { 
			player: player_id, 
			message: message
		});
	}
}

var updateStatusAndCheckVulture = function(_id, callback, io, user) {
	sendMessage(io, user, _id, "Contacting MLB.com for player info...");
	
	PLAYERMLB.update(function(player) {

		sendMessage(io, user, _id, "MLB Status: " + player.status_code);
		sendMessage(io, user, _id, "Checking ESPN league roster page...");

		PLAYERESPN.updateFromESPNTransactionsPage(function() {
			PLAYERESPN.updatePlayersFromLeaguePage(function(player) {

				if(!player) {
					sendMessage(io, user, _id, "Fantasy Status: Free Agent");

					callback(true);

				} else {
					sendMessage(io, user, _id, "Fantasy Status: " + player.fantasy_status_code);

					if(player.status_code == player.fantasy_status_code) {
						callback(true, player.status_code, player.fantasy_status_code);
					} else {
						callback(false, player.status_code, player.fantasy_status_code);
					}
				}

			}, player.espn_player_id);
		});
	}, _id);
};

var removeVulture = function(player, callback) {
	player.vulture = undefined;
	ASYNC.series([
		function(cb) {
			player.save(function() {
				cb();
			});
		}, function(cb) {
			PLAYER.findOne({ 'vulture.vultured_for_id' : player._id }, function(err, givingUpPlayer) {
				if(givingUpPlayer) {
					givingUpPlayer.vulture.vultured_for_id = undefined;
					givingUpPlayer.save(function() {
						cb();
					});
				} else {
					cb();
				}
			});
		}
	], function() {
		if(callback) {
			callback();
		}
	});
}

module.exports = {
	removeVulture : removeVulture,
	canPlayerBeVultured : canPlayerBeVultured,
	isVultureLegal : isVultureLegal,
	updateStatusAndCheckVulture : updateStatusAndCheckVulture
}