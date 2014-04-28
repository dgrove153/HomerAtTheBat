var APP = require("../application/app");
var CONFIG = require('../config/config').config();
var NUMERAL = require("numeral");
var PLAYER = require("../models/player");
var PLAYERSTATS = require('../application/player/update/stats');
var SCHEDULE = require("../application/schedule");

var getStatsForTeam = function(team, callback) {
	SCHEDULE.getSchedule(function(games) {
		PLAYERSTATS.updateDailyStats(games, function() {
			var statsYear = CONFIG.year;
			var search = { fantasy_status_code : 'A', history: { "$elemMatch" : { year: statsYear, fantasy_team : team }}};
			PLAYER.find(search, function(err, players) {
				var dailyBattingStats = {};
				var dailyPitchingStats = {};
				players.forEach(function(p) {
					if(p.primary_position == 1) {
						for(var stat in p.dailyStats) {
							if(dailyPitchingStats[stat] == undefined) {
								dailyPitchingStats[stat] = 0;
							}
							dailyPitchingStats[stat] += p.dailyStats[stat];
						};
					} else {
						for(var stat in p.dailyStats) {
							if(dailyBattingStats[stat] == undefined) {
								dailyBattingStats[stat] = 0;
							}
							dailyBattingStats[stat] += p.dailyStats[stat];
						};
					}
				});
				dailyBattingStats.obp = (dailyBattingStats.h + dailyBattingStats.bb + dailyBattingStats.hbp) / 
					(dailyBattingStats.ab + dailyBattingStats.bb + dailyBattingStats.hbp + dailyBattingStats.sf);
				if(dailyBattingStats.obp < 1) {
					dailyBattingStats.obp = NUMERAL(dailyBattingStats.obp).format(".000");
				}
				callback(players, dailyBattingStats, dailyPitchingStats);
			});
		});
	});
}

var getGameInfo = function(team, callback) {
	var playerIds = [];
	var pitcherIds = [];
	var teamToLinescore = {};
	SCHEDULE.getSchedule(function(games) {
		SCHEDULE.getLinescores(games, function(linescores) {
			linescores.forEach(function(l) {
				teamToLinescore[l.away_team_id] = l;
				teamToLinescore[l.home_team_id] = l;
				if(l.current_batter && l.due_up_batter && l.current_pitcher && l.opposing_pitcher) {
					playerIds.push(l.current_batter.id);
					playerIds.push(l.due_up_batter.id);
					pitcherIds.push(l.current_pitcher.id);
					pitcherIds.push(l.opposing_pitcher.id);
				}
			});
			var statsYear = CONFIG.year;
			var search = { fantasy_status_code : 'A', history: { "$elemMatch" : { year: statsYear, fantasy_team : team }}};
			PLAYER.find(search, function(err, players) {
				PLAYER.find({ player_id : { "$in" : playerIds }}, function(err, atBatPlayers) {
					PLAYER.find({ player_id : { "$in" : pitcherIds }}, function(err, currentPitchers) {
						var previewPlayers = [];
						var inProgressPlayers = [];
						var finalPlayers = [];
						players.forEach(function(p) {
							p.stats.forEach(function(s) {
								if(s.year == CONFIG.year) {
									p.seasonStats = s;
								}
							});
							p.battersTillUp = -1;
							p.linescore = teamToLinescore[p.team_id];
							if(teamToLinescore[p.team_id] && (
								teamToLinescore[p.team_id].status == "Final" || teamToLinescore[p.team_id].status == "Game Over")) {
								finalPlayers.push(p);
							} else if(teamToLinescore[p.team_id] && (
								teamToLinescore[p.team_id].status == "In Progress" || teamToLinescore[p.team_id].status == "Manager Challenge")) {
								if(p.dailyStats.bo > 0) {
									console.log("Player: " + p.name_display_first_last + " " + p.dailyStats.bo);
									atBatPlayers.forEach(function(abp) {
										if(abp.team_id == p.team_id) {
											console.log("Now Batting: " + abp.name_display_first_last + " " + abp.dailyStats.bo);
											var pBo = (p.dailyStats.bo - (p.dailyStats.bo % 100)) / 100;
											var abpBo = (abp.dailyStats.bo - (abp.dailyStats.bo % 100)) / 100;
											var pSpot = pBo - abpBo;
											if(pSpot < 0) {
												pSpot = pSpot + 9;
											}
											p.battersTillUp = pSpot;
											console.log("Up In: " + p.name_display_first_last + " " + p.battersTillUp);
										}
									});
									currentPitchers.forEach(function(cp) {
										var gameLinescore = teamToLinescore[cp.team_id];
										if(cp.team_id != p.team_id && 
											(gameLinescore.home_team_id == p.team_id || gameLinescore.away_team_id == p.team_id)) {
											p.opposingPitcher = cp;
										}
									});
								}
								inProgressPlayers.push(p);
							} else {
								if(teamToLinescore[p.team_id]) {
									previewPlayers.push(p);
								}
							}
						});
						previewPlayers.sort(function(a, b) {
							if(!a.linescore) {
								return 1;
							}
							if(!b.linescore) {
								return -1;
							}
							var aDate = new Date(a.linescore.time_date);
							var bDate = new Date(b.linescore.time_date);
							if(aDate > bDate) {
								return 1;
							} else if(aDate < bDate) {
								return -1;
							} else {
								return 1;
							}
						});
						inProgressPlayers.sort(function(a, b) {
							if(a.battersTillUp == -1) {
								return 1;
							}
							if(b.battersTillUp == -1) {
								return -1;
							}
							return a.battersTillUp - b.battersTillUp;
						});
						callback(previewPlayers, inProgressPlayers, finalPlayers);
					});
				});
			});
		});
	});
}

module.exports = {
	getStatsForTeam : getStatsForTeam,
	getGameInfo : getGameInfo
}