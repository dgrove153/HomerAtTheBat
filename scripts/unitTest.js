var 	env = process.env.NODE_ENV || 'development';
var 	config = require('../config/config').setUpEnv(env).config();
 var PLAYER = require('../models/player');
// var MINORLEAGUEDRAFT = require('../application/minorLeagueDraft');
var mongoose = require('mongoose');
var ASYNC = require('async');
 var MLB = require('../external/mlb');
var ESPN = require('../external/espn');
// var JOBS = require('../application/jobs');
//Environment variables
 var KEEPERS = require('../application/keeper');
 var MOMENT = require('moment');
// var DRAFTPROJECTION = require("../application/draftProjection");
// var MAILER = require('../util/mailer');

//Database connection
mongoose.connect(config.db);

var TRADECREATE = require("../application/trade/create");


var vulture_id = '525f6c3e300ec5cd650008c6';
var giving_up_id = '525f6c3e300ec5cd65000479';

var pick = {
	overall: 1,
	team: 'LAZ',
	player_id: 572888
};

var trade = { 
	items : [ { from: "1",
		id: "_1_532f11130e3608210800000e",
		itemType: "PLAYER",
		player_id: "532f11130e3608210800000e",
		player_name: "Eddie Butler",
		team: "1",
		to: "5"
		},
		{
		from: "5",
		id: "_5_525f6c3d300ec5cd6500004d",
		itemType: "PLAYER",
		player_id: "525f6c3d300ec5cd6500004d",
		player_name: "Xander Bogaerts",
		team: "5",
		to: "1"
		}
		],
		proposedBy: 1,
		proposedTo: 5 };

// TRADECREATE.submitTrade(trade, function(success, message) {
// 	console.log(success);
// 	console.log(message);
// });

//PLAYER.updateTeamByDate();
var TEAM = require("../models/team");
var PLAYERSTATS = require("../application/player/update/stats");
// TEAM.find({ teamId : { $ne : 0 } }, function(err, teams) {
// 	ASYNC.forEachSeries(teams, function(t, cb) {
// 		PLAYERSTATS.getDailyStatsForTeam(t.teamId, function() {
// 			cb();
// 		});
// 	}, function() {
		//TEAM.updateStats();
// 	});
// });
PLAYERSTATS.getDailyStatsForTeam(11, function() {

});
var MLB = require("../external/mlb");
// MLB.lookupDailyStats(488768, false, function(stats) {
// 	console.log(stats.h);
// 	console.log(stats);
// })

// TEST 1: DRAFT
// MINORLEAGUEDRAFT.submitPick(pick, function(message) {
// 	console.log(message);
// });

// TEST 2: UPDATE MLB
// PLAYERMLB.updateAll(function(message) {
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
// 			PLAYER.findOne({_id:vulture_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({_id:giving_up_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			VULTURE.removeVulture(vulture_id, function(message) {
// 				console.log(message);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({_id:vulture_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({_id:giving_up_id}, function(err, player) {
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
var PLAYERESPN = require('../application/player/update/espn');
var PLAYERSTATS = require('../application/player/update/stats');
// PLAYERESPN.updateAllPlayersFromLeaguePage(function() {
// 	console.log('done updating');
// });
// PLAYERESPN.updateFromESPNTransactionsPage(function() {
// 	console.log("done");
// });
// var PLAYERMLB = require('../application/player/update/mlb');
// PLAYERMLB.update(function(player) {
// 	console.log(player);
// }, '525f6c4d73f378ce6500009c');
// PLAYERMLB.update40ManRosters(function() {
// 	console.log('done adding players');
// });
// PLAYERMLB.update(function(count) {
// 	console.log("saved " + count + " players");
// }, 543391);
// ESPN.getDraft(2014, function(playerName, playerId, teamId, dollars, isKeeper, cb) {
// 	PLAYER.findOne({ $or: [ { espn_player_id : playerId } , { name_display_first_last : playerName } ] }, function(err, player) {
// 		if(!player) {
// 			console.log("COULDN'T FIND " + playerName + " " + dollars + " " + playerId + " " + teamId + " " + isKeeper);
// 			cb();
// 		} else {
// 			var historyIndex = PLAYER.findHistoryIndex(player, config.year);
// 			if(isKeeper) {
// 				//console.log("not touching " + player.name_display_first_last + " since they were a keeper");
// 				cb();
// 			} else if(dollars > 0) {
// 				if(player.history[historyIndex].draft_team != teamId) {
// 					player.history[historyIndex].fantasy_team = teamId;
// 					player.history[historyIndex].draft_team = teamId;
// 					player.history[historyIndex].salary = dollars;
// 					player.espn_player_id = playerId;
// 					player.save(function(err, player) {
// 						//console.log("NEW ESPN ID, " + player.name_display_first_last + " " + player.espn_player_id);
// 						cb();
// 					});
// 				} else {
// 					//console.log("already had " + player.name_display_first_last);
// 					cb();
// 				}
// 			} else {
// 				//console.log("not touching " + player.name_display_first_last + " worth 0 dollars");
// 				cb();
// 			}
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
// KEEPERS.finalizeKeeperSelections(function() {
// 	console.log('done');
// });
//DRAFTPROJECTION.reset();
//DRAFTPROJECTION.init();
//DRAFTPROJECTION.sumStatsForTeam('fans', function() { });
//DRAFTPROJECTION.getPlayersOnTeam();
// PLAYER.find({}, function(err, players) {
// 	players.forEach(function(player) {
// 		player.history_index = PLAYER.findHistoryIndex(player, config.year);
// 		player.save();
// 	});
// });
// ESPN.getESPNStandings(2013, function(hash) {
// 	console.log(hash);
// })

//PLAYERSTATS.getDailyStatsForTeam(12);
// var GAME = require("../models/mlbGame");
// GAME.getTodaysSchedule(function(games) {
// 	console.log(games);
// });
// MLB.getSchedule(function(d) {
// 	d.forEach(function(j) {
// 		GAME.createNew(j);
// 	});
// });