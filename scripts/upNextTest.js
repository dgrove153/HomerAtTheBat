var env = process.env.NODE_ENV || 'development';
var CONFIG = require('../config/config').setUpEnv(env).config();
var mongoose = require('mongoose');
mongoose.connect(CONFIG.db);

var PLAYERSTATS = require("../application/player/update/stats");
var GAME = require("../models/mlbGame");
var ASYNC = require('async');
var MLB = require("../external/mlb");
var PLAYER = require("../models/player");
var SCHEDULE = require("../application/schedule");

var playerHash = {};

var doIt = function(team, callback) {
	GAME.getTodaysSchedule(function(games) {
		ASYNC.forEachSeries(games, function(g, gameCB) {
			MLB.lookupDailyStats(g.gameday, function(teams) {
				if(!teams) {
					gameCB();
				} else {
					var stats = teams.batting;
					ASYNC.forEachSeries(stats, function(t, teamCB) {
						ASYNC.forEachSeries(t.batter, function(b, playerCB) {
							// PLAYER.findOne({ name_display_first_last : b.name_display_first_last }, function(err, player) {
							// 	if(!player) {
							// 		console.log("COULND'T FIND " + b.name_display_first_last);
							// 		playerCB();
							// 	} else {
							// 		player.save(function() {
							// 			playerCB();
							// 		});
							// 	}
							// });
							PLAYER.findOne({ player_id : b.id }, function(err, player) {
								playerHash[b.id] = b;
								if(player) {
									playerHash[b.id].team_id = player.team_id;	
								}
								playerCB();
							});
							//console.log(b.name_display_first_last + " " + b.bo);
						}, function() {
							teamCB();
						});
					}, function() {
						stats = teams.pitching;
						ASYNC.forEachSeries(stats, function(t, teamCB) {
							ASYNC.forEachSeries(t.pitcher, function(b, playerCB) {
								// PLAYER.findOne({ name_display_first_last : b.name_display_first_last }, function(err, player) {
								// 	if(!player) {
								// 		console.log("COULND'T FIND " + b.name_display_first_last);
								// 		playerCB();
								// 	} else {
								// 		player.save(function() {
								// 			playerCB();
								// 		});
								// 	}
								// });
								playerCB();
							}, function() {
								teamCB();
							});
						}, function() {
							SCHEDULE.getLinescore(g.gameday, function(l) {
								if(l.current_batter && l.due_up_batter) {
									playerHash[l.current_batter.id].isBatter = true;
									playerHash[l.due_up_batter.id].isBatter = true;
								}
								gameCB();
							});
						});
					});
				}
			});
		}, function() {
			var statsYear = CONFIG.year;
			var search = { history: { "$elemMatch" : { year: statsYear, fantasy_team : team }}};
			PLAYER.find(search, function(err, players) {
				callback(players);
			});
		});
	});
};

// doIt(11, function(players) {
// 	players.forEach(function(p) {
// 		var pLinescore = playerHash[p.player_id];
// 		if(pLinescore) {
// 			var pTeam = p.team_id;
// 			var pSpot;
// 			for(var pk in playerHash) {
// 				var ps = playerHash[pk];
// 				if(ps.team_id == pTeam && ps.isBatter) {
// 					console.log(p.name_display_first_last);
// 					console.log(ps.bo);
// 					console.log(pLinescore.bo);
// 					pSpot = pLinescore.bo - ps.bo;
// 					if(pSpot < 0) {
// 						pSpot = pSpot + 900;
// 					}
// 					break;
// 				}
// 			}
// 			console.log(p.name_display_first_last + " " + pSpot);
// 		}
// 	})
// });

 var STATTRACKER = require("../application/stattracker");
// STATTRACKER.getPlayersForTeam(1, function(players) {
// 	players.forEach(function(p) {
// 		console.log(p.linescore);
// 	})
// })

STATTRACKER.getGameInfo(4, function(players) {
	players.forEach(function(p) {
		console.log(p.name_display_first_last + " " + p.battersTillUp);
	})
});