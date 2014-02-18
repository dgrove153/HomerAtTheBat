var 	env = process.env.NODE_ENV || 'development';
var 	config = require('../config/config').setUpEnv(env).config();
var PLAYER = require('../models/player');
var MINORLEAGUEDRAFT = require('../application/minorLeagueDraft');
var VULTURE = require('../application/vulture');
var mongoose = require('mongoose');
var ASYNC = require('async');
var MLB = require('../external/mlb');
var ESPN = require('../external/espn');
var JOBS = require('../application/jobs');
//Environment variables
var KEEPERS = require('../application/keeper');
var DRAFTPROJECTION = require("../application/draftProjection");
var MAILER = require('../util/mailer');

//Database connection
mongoose.connect(config.db);

var vulture_id = 519184;
var giving_up_id = 501647;

var pick = {
	overall: 1,
	team: 'LAZ',
	player_id: 572888
};

// TEST 1: DRAFT
// MINORLEAGUEDRAFT.submitPick(pick, function(message) {
// 	console.log(message);
// });

// TEST 2: UPDATE MLB
// PLAYER.updateMLB_ALL(function(message) {
// 	console.log(message);
// });

// TEST 3: VULTURE
// ASYNC.series(
// 	[
// 		function(cb) {
// 			VULTURE.submitVulture(vulture_id, giving_up_id, { team:'GOB'}, function(message, url) {
// 				console.log(message);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({player_id:vulture_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({player_id:giving_up_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			VULTURE.removeVulture(vulture_id, function(message) {
// 				console.log(message);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({player_id:vulture_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({player_id:giving_up_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}
// 	]
// );

// TEST 4: Player is vulturable
// PLAYER.findOne({player_id:vulture_id}, function(err, player) {
// 	player.status_code = 'A';
// 	player.fantasy_status_code = 'DL';
// 	player.save(function() {
// 		VULTURE.isVultureLegal(vulture_id, giving_up_id, function(bool) {
// 			console.log(bool);
// 		});
// 	});
// });

// TEST 5: Player is not vulturable because of giving up player
// PLAYER.findOne({player_id:giving_up_id}, function(err, player) {
// 	player.vulture = { vultured_for_pid : 100 };
// 	player.save(function() {
// 		VULTURE.isVultureLegal(vulture_id, giving_up_id, function(bool) {
// 			console.log(bool);
// 		});
// 	});
// });

// TEST 6: Lockup
// //unsuccessful
// PLAYER.lockUpPlayer(519184, function(message) {
// 	console.log(message);
// });
// //successful
// PLAYER.lockUpPlayer(430832, function(message) {
// 	console.log(message);
// });

// TEST 7: ESPN Transactions
//ESPN.updateESPN_Transactions('all');
PLAYER.updateMLB_40ManRosters(function() {
	console.log('done adding players');
});
// ESPN.getDraft(2013, function(playerName, playerId, teamId, dollars, isKeeper, cb) {
// 	PLAYER.findOne({ $or: [ { espn_player_id : playerId } , { name_display_first_last : playerName } ] }, function(err, player) {
// 		if(!player) {
// 			console.log("COULDN'T FIND " + playerName + " " + dollars + " " + playerId + " " + teamId + " " + isKeeper);
// 			cb();
// 		} else {
// 			var historyIndex = PLAYER.findHistoryIndex(player, config.year);
// 			player.history[historyIndex].draft_team = teamId;
// 			player.history[historyIndex].salary = dollars;
// 			player.espn_player_id = playerId;
// 			player.save(function(err, player) {
// 				console.log("NEW ESPN ID, " + player.name_display_first_last + " " + player.espn_player_id);
// 				cb();
// 			});
// 		}
// 	});
// });
// PLAYER.find({espn_player_id:{$exists:false}}, function(err, players) {
// 	ASYNC.forEachSeries(players, function(player, cb) {
// 		console.log("trying to find " + player.name_display_first_last);
// 		var lastName = player.name_display_first_last.split(' ')[1];
// 		var isHitter = player.primary_position != 1;
// 		ESPN.findPlayerId(lastName, player.name_display_first_last, isHitter, function(playerName, playerId) {
// 			if(playerName) {
// 				player.espn_player_id = playerId;
// 				player.save(function() {
// 					console.log(player.name_display_first_last + " saved with id " + playerId);
// 					cb();
// 				});
// 			} else {
// 				console.log(player.name_display_first_last + " is not on ESPN");
// 				cb();
// 			}
// 		});
// 	}, function(err) {
// 		console.log("done");
// 	});
// });
// ESPN.findPlayerId('sanchez','Gary Sanchez',true);
// TEST 8: MLB STATS
// MLB.lookupPlayerStats(519184, true, 2013, function(json) {
// 	console.log(json);
// });
// MLB.lookupPlayerStats(433587, false, 2013, function(json) {
// 	console.log(json);
// });
// MLB.lookupAllRosters(function(player, cb) {
// 	PLAYER.findOne({ player_id : player.player_id }, function(err, dbPlayer) {
// 		if(!dbPlayer) {
// 			PLAYER.createNewPlayer(player, undefined, undefined, undefined, function(newPlayer) {
// 				console.log("added " + newPlayer.name_display_first_last);
// 				cb();
// 			});
// 		} else {
// 			cb();
// 		}
// 	});
// });
// PLAYER.updateMinorLeagueThreshholds(519184, function(player) {
// 	console.log(player.name_display_first_last);
// 	console.log(player.at_bats);
// 	console.log(player.innings_pitched);
// });
// PLAYER.updateMinorLeagueThreshholds(433587, function(player) {
// 	console.log(player.name_display_first_last);
// 	console.log(player.at_bats);
// 	console.log(player.innings_pitched);
// });
// PLAYER.updateStats(true, function() {
// 	console.log('done getting stats');
// });

// TEST 9: ESPN LEAGUE ROSTER
// ASYNC.series(
// 	[
// 		function(cb) {
// 			PLAYER.updateFromESPNTransactionsPage('all', cb);
// 		}
// 		},
// 		function(cb) {
// 			PLAYER.updateFromESPNLeaguePage(function(d) {
// 				console.log(d);
// 				cb();
// 			})
// 		}
// 	]
// );
// ESPN.updateESPN(3557, function(m) {
// 	console.log(m);
// });

// TEST 10: JOBS
// JOBS.updateESPNRosters();

// TEST 11: KEEPERS
//KEEPERS.finalizeKeeperSelections();
//DRAFTPROJECTION.reset();
//DRAFTPROJECTION.init();
//DRAFTPROJECTION.sumStatsForTeam('fans', function() { });
//DRAFTPROJECTION.getPlayersOnTeam();