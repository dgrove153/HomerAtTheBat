var ASYNC = require('async');
var AUDIT = require("../../../models/externalAudit");
var CONFIG = require("../../../config/config").config();
var ESPN = require("../../../external/espn");
var PLAYER = require("../../../models/player");
var UTIL = require("../../../application/util");

//Update player team, status code, and fantasy position via league page
var savePlayer = function(dbPlayer, position, callback) {
	var historyIndex = PLAYER.findHistoryIndex(dbPlayer, CONFIG.year);
	dbPlayer.history[historyIndex].fantasy_position = position;
	dbPlayer.fantasy_status_code = UTIL.positionToStatus(position);
	dbPlayer.save(function(err, player) {
		callback(player);
	});
}

var updatePlayer = function(espnPlayerId, name, position, teamId, callback) {
	//Find player by espn id
	PLAYER.findOne({ espn_player_id : espnPlayerId }, function(err, dbPlayer) {
		if(dbPlayer == null) {
			//no player with given espn id, search by name
			PLAYER.findOne({ name_display_first_last : name }, function(err, namePlayer) {
				if(namePlayer == null) {
					//no player with that name, create a new player
					namePlayer = new PLAYER();
					namePlayer.name_display_first_last = name;
					namePlayer.history = [{ 
						year: CONFIG.year,
						salary: 0,
						fantasy_team: teamId
					}];
					console.log('adding ' + name);
				}
				//set espn id 
				namePlayer.espn_player_id = espnPlayerId;

				//save player
				savePlayer(namePlayer, position, callback);
			});
		} else {
			//found player via espn id
			//save player
			savePlayer(dbPlayer, position, callback);
		}
	});
}

exports.updatePlayersFromLeaguePage = function(finishedCallback, espn_id) {
	ESPN.getLeagueRosterPage(function(espnPlayerId, name, position, teamId, callback) {
		updatePlayer(espnPlayerId, name, position, teamId, callback);
	}, finishedCallback, espn_id);
}

var dropPlayer = function(asyncCallback, player, espn_team, text, move, time) {
	AUDIT.isDuplicate('ESPN_TRANSACTION', player.name_display_first_last, 0, 'DROP', time, function(isDuplicate) {
		if(!isDuplicate) {
			if(player.history[0].fantasy_team == espn_team) {
				
				if(player.status_code == 'MIN') {
					//this is actually a minor league demotion, not a drop
					console.log(player.name_display_first_last + " is being sent to the minor leagues, not dropped");
					player.fantasy_status_code = 'MIN';
					player.save();
					asyncCallback();	
				} else {
					//set last team properties
					player.last_team = player.history[0].fantasy_team;
					player.last_dropped = time;

					PLAYER.updatePlayerTeam(player, 0, CONFIG.year, function() { 
						AUDIT.auditESPNTran(player.name_display_first_last, 0, 'DROP', time, 
							player.name_display_first_last + " dropped by " + player.last_team);
						asyncCallback();
					});
				}
			} else {
				//this move is outdated
				console.log(player.name_display_first_last + " not on " + espn_team + ", can't drop");
				asyncCallback();
			}
		} else {
			console.log("dropping " + player.name_display_first_last + " from " + player.last_team + " has already been handled");
			asyncCallback();
		}
	})
};

var addPlayer = function(asyncCallback, player, espn_team, text, move, time) {
	AUDIT.isDuplicate('ESPN_TRANSACTION', player.name_display_first_last, espn_team, 'ADD', time, function(isDuplicate) {
		if(!isDuplicate) {
			if(player.history[0].fantasy_team != espn_team) {

				if(PLAYER.isMinorLeaguerNotFreeAgent(player, espn_team)) {
					console.log(player.name_display_first_last + " cannot be added to a team because they are a minor leaguer for " +
						player.history[0].fantasy_team);
					var message = 'Your add of ' + player.name_display_first_last + ' is illegal because he is a minor leaguer for ' +
						player.history[0].fantasy_team + '. Please drop them and e-mail Ari to remove the charge.';
					NOTIFICATION.createNew('ILLEGAL_ADD', player.name_display_first_last, espn_team, message, function() {
						asyncCallback();
					});
					return;
				}

				//check to see if we need to reset contract year
				if(PLAYER.shouldResetContractYear(player, espn_team, time)) {
					console.log("changing " + player.name_display_first_last + " contract year to 0");

					var historyIndex = Player.findHistoryIndex(player, CONFIG.year);
					player.history[historyIndex].contract_year = 0;
				}

				PLAYER.updatePlayerTeam(player, espn_team, CONFIG.year, function() { 
					AUDIT.auditESPNTran(player.name_display_first_last, espn_team, 'ADD', time, 
						player.name_display_first_last + " added by " + espn_team);
					asyncCallback();
				});
			} else {
				console.log(player.name_display_first_last + " is already on " + espn_team + ", can't add");
				asyncCallback();
			}
		} else {
			console.log("adding " + player.name_display_first_last + " to " + espn_team + " has already been handled");
			asyncCallback();
		}
	});
}

var handleTransactions = function(err, dom) {
	ESPN.parseESPNTransactions(dom, function(rowCB, playerName, team, text, move, time) {
		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
			if(player) {
				tranToFunction[move](rowCB, player, team, text, move, time);
			} else {
				console.log(playerName + ' not found');
				rowCB();
			}
		});	
	}, globalCallback);
};

var tranToFunction = {};
tranToFunction.dropped = dropPlayer;
tranToFunction.added = addPlayer;

var globalCallback;

exports.updateFromESPNTransactionsPage = function(callback, date) {
	globalCallback = callback;
	ESPN.getTransactionsPage(handleTransactions, date);
}

exports.findMissingESPNPlayerIds = function(callback) {
	var successCount = 0;
	var failCount = 0;
	PLAYER.find({ $or : [ { espn_player_id : { $exists : false }} , { espn_player_id : 1 } ] }, function(err, players) {
		ASYNC.forEachSeries(players, function(player, cb) {
			console.log("trying to find " + player.name_display_first_last);
			var lastName = player.name_display_first_last.split(' ')[1];
			var isHitter = player.primary_position != 1;
			ESPN.findPlayerId(lastName, player.name_display_first_last, isHitter, function(playerName, playerId) {
				if(playerName) {
					player.espn_player_id = playerId;
					player.save(function() {
						console.log(player.name_display_first_last + " saved with id " + playerId);
						successCount++;
						cb();
					});
				} else {
					console.log(player.name_display_first_last + " is not on ESPN");
					failCount++;
					cb();
				}
			});
		}, function(err) {
			callback(successCount, failCount);
		});
	});
};