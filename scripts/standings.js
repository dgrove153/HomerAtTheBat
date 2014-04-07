var env = process.env.NODE_ENV || 'development';
var config = require('../config/config').setUpEnv(env).config();
var mongoose = require('mongoose');
mongoose.connect(config.db);

var PLAYER = require("../models/player");
var TEAM = require("../models/team");
var PLAYERSTATS = require("../application/player/update/stats");
var MOMENT = require('moment');
var ASYNC = require('async');

var teamStats = {};
ASYNC.series([
	function(cb) {
		TEAM.find({}, function(err, teams) {
			ASYNC.forEachSeries(teams, function(t, innerCB) {
				teamStats[t.teamId] = { ab: 0, h: 0, hr: 0, rbi: 0, r: 0, sb: 0, cs: 0, ao: 0, go: 0, sf:0, bb: 0, hbp:0 };
				innerCB();
			}, function() {
				cb();
			});
		});
	},
	function(cb) {
		PLAYER.find({player_id:{"$exists":true}}, function(err, players) {
			var playerCount = players.length;
			ASYNC.forEachSeries(players, function(player, innerCB) {
				console.log("fetching for " + player.name_display_first_last);
				PLAYERSTATS.getGameLog(player, function(stats) {
					console.log("got stats for " + player.name_display_first_last);
					playerCount--;
					if(!stats || stats == {}) { innerCB(); return; }
					if(stats.constructor == Object) { stats = [ stats ]; }
					var playerStats = { ab: 0, h: 0, hr: 0, rbi: 0, r: 0, sb: 0, cs: 0, ao: 0, go: 0, sf:0, bb: 0, hbp:0 };
					console.log(stats);
					ASYNC.forEachSeries(stats, function(gameStat, statCB) {
						var gameDate = MOMENT(gameStat.game_date).format('L');
						console.log(gameDate);
						ASYNC.forEachSeries(player.teamByDate, function(playerToTeam, playerCB) {
							if(playerToTeam && playerToTeam.date && playerToTeam.team) {
								var playerDate = MOMENT(playerToTeam.date).format('L');
								if(playerDate == gameDate) {
									for(var prop in gameStat) {
										var team = playerToTeam.team;
										if(teamStats[team].hasOwnProperty(prop) && gameStat[prop].length > 0 && isFinite(gameStat[prop])) {
											console.log("adding a stat");
											teamStats[team][prop] += parseInt(gameStat[prop]);
										}
									}
								}	
							}
							playerCB();
						}, function() {
							statCB();
						});
					});
					console.log("players left " + playerCount);
					innerCB();
					// playerStats.obp = (playerStats.h + playerStats.bb + playerStats.hbp) / 
					// 	(playerStats.ab + playerStats.bb + playerStats.hbp + playerStats.sf);
				});
			}, function() {
				console.log("done");
				cb();
			});
		});
	}, 
	function(cb) {
		console.log("ari");
		console.log(teamStats);
	}
]);