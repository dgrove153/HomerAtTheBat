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
		TEAM.find({}).sort({ standings: 1}).exec(function(err, teams) {
			ASYNC.forEachSeries(teams, function(t, innerCB) {
				teamStats[t.teamId] = { 
					teamName: t.fullName, 
					batting : 
						{ ab:0, h: 0, hr: 0, rbi: 0, r: 0, sb: 0, cs: 0, ao: 0, go: 0, sf:0, bb: 0, hbp:0 },
					pitching : 
						{ ab:0, h: 0, hb: 0, so: 0, bb: 0, er: 0, ip: 0, ao: 0, go: 0, ibb:0, np: 0, s: 0, hr: 0, sv:0, w:0 }
				};
				innerCB();
			}, function() {
				cb();
			});
		});
	},
	function(cb) {
		PLAYER.find({player_id:{"$exists":true}}, function(err, players) {
			var playerCount = players.length;
			ASYNC.forEach(players, function(player, innerCB) {
				PLAYERSTATS.getGameLog(player, function(stats) {
					playerCount--;
					if(!stats || stats == {}) { innerCB(); return; }
					if(stats.constructor == Object) { stats = [ stats ]; }
					ASYNC.forEach(stats, function(gameStat, statCB) {
						var gameDate = MOMENT(gameStat.game_date).format('L');
						ASYNC.forEach(player.teamByDate, function(playerToTeam, playerCB) {
							if(playerToTeam && playerToTeam.date && playerToTeam.team) {
								var playerDate = MOMENT(playerToTeam.date).format('L');
								if(playerDate == gameDate) {
									if(playerToTeam.team == 1 && player.primary_position != 1) {
										console.log(player.name_display_first_last + " " + playerDate);
									}
									for(var prop in gameStat) {
										var team = playerToTeam.team;
										if(player.primary_position == 1) {
											if(teamStats[team].pitching.hasOwnProperty(prop) && gameStat[prop].length > 0 && isFinite(gameStat[prop])) {
												if(prop == 'ip') {
													var innArray = gameStat[prop].split('.');
													var innings_pitched;
													if(isFinite(parseInt(innArray[0]))) {
														innings_pitched = parseInt(innArray[0]);	
													} else {
														innings_pitched = 0;
													}
													if(innArray.length > 1) {
														innings_pitched += parseInt(innArray[1]) / 3;
													}
													teamStats[team].pitching[prop] += innings_pitched;
												} else {
													teamStats[team].pitching[prop] += parseInt(gameStat[prop]);
												}
											}
										} else {
											if(teamStats[team].batting.hasOwnProperty(prop) && gameStat[prop].length > 0 && isFinite(gameStat[prop])) {
												teamStats[team].batting[prop] += parseInt(gameStat[prop]);
											}
										}
									}
								}	
							}
							playerCB();
						}, function() {
							statCB();
						});
					});
					innerCB();
				});
			}, function() {
				cb();
			});
		});
	}, 
	function(cb) {
		for(var team in teamStats) {
			teamStats[team].batting.obp =
				(teamStats[team].batting.h + teamStats[team].batting.bb + teamStats[team].batting.hbp) / 
				(teamStats[team].batting.ab + teamStats[team].batting.bb + teamStats[team].batting.hbp + teamStats[team].batting.sf);
			teamStats[team].pitching.whip =
				(teamStats[team].pitching.bb + teamStats[team].pitching.h) / (teamStats[team].pitching.ip);
			teamStats[team].pitching.era =
				(teamStats[team].pitching.er * 9) / (teamStats[team].pitching.ip);
			console.log(
				teamStats[team].teamName + 
				" R: " + teamStats[team].batting.r + 
				" HR: " + teamStats[team].batting.hr + 
				" RBI: " + teamStats[team].batting.rbi + 
				" SB: " + teamStats[team].batting.sb + 
				" OBP: " + teamStats[team].batting.obp
			);
			console.log(
				" K: " + teamStats[team].pitching.so +
				" W: " + teamStats[team].pitching.w +
				" SV: " + teamStats[team].pitching.sv +
				" ERA: " + teamStats[team].pitching.era +
				" WHIP: " + teamStats[team].pitching.whip +
				" IP: " + teamStats[team].pitching.ip);
		}
	}
]);