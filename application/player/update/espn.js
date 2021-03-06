var ASYNC = require('async');
var AUDIT = require("../../../models/externalAudit");
var CONFIG = require("../../../config/config").config();
var CONSTANTS = require("../../../application/constants");
var ESPN = require("../../../external/espn");
var MAILER = require("../../../util/mailer");
var NOTIFICATION = require('../../../models/notification');
var PLAYER = require("../../../models/player");
var PLAYERMINORLEAGUER = require("../../../application/player/minorLeaguer");
var PLAYERSEARCH = require("../search");
var UTIL = require("../../../application/util");


//Update player team, status code, and fantasy position via league page
var savePlayer = function(dbPlayer, position, callback) {
	var historyIndex = dbPlayer.findHistoryIndex(CONFIG.year);
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
			var historyIndex = player.findHistoryIndex(CONFIG.year);
			if(player.history[historyIndex].fantasy_team == espn_team) {
				
				if(player.fantasy_status_code == CONSTANTS.StatusCodes.Minors) {
					//this is actually a minor league demotion, not a drop
					console.log(player.name_display_first_last + " is being sent to the minor leagues, not dropped");
					asyncCallback();	
				} else {
					//set last team properties
					player.last_team = player.history[historyIndex].fantasy_team;
					player.last_dropped = time;

					player.updatePlayerTeam(0, CONFIG.year, function() { 
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
			var historyIndex = player.findHistoryIndex(CONFIG.year);
			if(player.history[historyIndex].fantasy_team != espn_team) {

				AUDIT.auditESPNTran(player.name_display_first_last, espn_team, 'ADD', time, 
							player.name_display_first_last + " added by " + espn_team);

				if(player.fantasy_status_code == CONSTANTS.StatusCodes.Minors) {
					console.log(player.name_display_first_last + " cannot be added to a team because they are a minor leaguer for " +
						player.history[historyIndex].fantasy_team);
					var message = 'Your add of ' + player.name_display_first_last + ' is illegal because he is a minor leaguer for ' +
						' another team. Please drop them and e-mail Ari to remove the charge.';
					NOTIFICATION.createNew('ILLEGAL_ADD', player.name_display_first_last, espn_team, message, function() {
						asyncCallback();
					});
					var html = "<h3>A recent move you made is illegal</h3><p>" + message + "</p>";
					MAILER.sendMail({ 
						from: 'Homer Batsman',
						to: [ 1, espn_team ],
						subject: "Illegal Add of " + player.name_display_first_last,
						html: html
					});
				} else if(player.history[historyIndex].fantasy_team != 0) {
					console.log(player.name_display_first_last + " is not a free agent according to HomerAtTheBat even though ESPN thinks he is");
					var message = "Your add of " + player.name_display_first_last + " is illegal because, while he appears to be " +
						" a free agent, he is still on another team. Please drop them and e-mail Ari to remove the charge.";
					var html = "<h3>A recent move you made is illegal</h3><p>" + message + "</p>";
					MAILER.sendMail({ 
						from: 'Homer Batsman',
						to: [ 1, espn_team ],
						subject: "Illegal Add of " + player.name_display_first_last,
						html: html
					});
					NOTIFICATION.createNew('ILLEGAL_ADD', player.name_display_first_last, espn_team, message, function() {
						asyncCallback();
					});
				} else {
					//check to see if we need to reset contract year
					if(PLAYER.shouldResetContractYear(player, espn_team, time)) {
						console.log("changing " + player.name_display_first_last + " contract year to 0");

						player.history[historyIndex].contract_year = 0;
					}

					player.updatePlayerTeam(espn_team, CONFIG.year, function() { 
						asyncCallback();
					});
				}

			} else {
				console.log(espn_team + " is calling up " + player.name_display_first_last);
				PLAYERMINORLEAGUER.promoteToActiveRoster(player._id, function() {
					asyncCallback();
				});
			}
		} else {
			console.log("adding " + player.name_display_first_last + " to " + espn_team + " has already been handled");
			asyncCallback();
		}
	});
}

var handleTransactions = function(err, dom) {
	ESPN.parseESPNTransactions(dom, function(rowCB, playerName, team, text, move, time) {
		PLAYER.findOne({ $or : [ { name_display_first_last : playerName}, { espn_player_name : playerName } ] }, function(err, player) {
			if(move == 'traded') {
				console.log("don't know how to handle trades yet");
				rowCB();
			} else if(player) {
				tranToFunction[move](rowCB, player, team, text, move, time);
			} else {
				MAILER.sendMail({
					from: 'Homer Batsman',
					to: [ 1 ],
					subject: "Unknown player",
					text: "Unknown player " + playerName + " was " + move + " by " + team
				});
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
	PLAYERSEARCH.findPlayersMissingESPNIds(function(players) {
		ASYNC.forEachSeries(players, function(player, cb) {
			console.log("trying to find " + player.name_display_first_last);
			var lastName = player.name_display_first_last.split(' ')[1];
			var isHitter = player.primary_position != 1;
			ESPN.findPlayerId(lastName, player.name_display_first_last, player.espn_player_name, isHitter, function(playerName, playerId) {
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