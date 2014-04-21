var APP = require("../application/app");
var CONFIG = require('../config/config').config();
var SCHEDULE = require("../application/schedule");
var PLAYER = require("../models/player");
var PLAYERSTATS = require('../application/player/update/stats');

var getStatsForTeam = function(team, callback) {
	SCHEDULE.getSchedule(function(games) {
		PLAYERSTATS.updateDailyStats(games, function() {
			var statsYear = CONFIG.year;
			var search = { fantasy_status_code : 'A', history: { "$elemMatch" : { year: statsYear, fantasy_team : team }}};
			PLAYER.find(search, function(err, players) {
				callback(players);
			});
		});
	});
}

var getGameInfo = function(team, callback) {
	var playerIds = [];
	var teamToLinescore = {};
	SCHEDULE.getSchedule(function(games) {
		SCHEDULE.getLinescores(games, function(linescores) {
			linescores.forEach(function(l) {
				teamToLinescore[l.away_team_id] = l;
				teamToLinescore[l.home_team_id] = l;
				if(l.current_batter && l.due_up_batter) {
					playerIds.push(l.current_batter.id);
					playerIds.push(l.due_up_batter.id);
				}
			});
			var statsYear = CONFIG.year;
			var search = { fantasy_status_code : 'A', history: { "$elemMatch" : { year: statsYear, fantasy_team : team }}};
			PLAYER.find(search, function(err, players) {
				PLAYER.find({ player_id : { "$in" : playerIds }}, function(err, atBatPlayers) {
					var previewPlayers = [];
					var inProgressPlayers = [];
					var finalPlayers = [];
					players.forEach(function(p) {
						p.battersTillUp = -1;
						p.linescore = teamToLinescore[p.team_id];
						if(teamToLinescore[p.team_id] && teamToLinescore[p.team_id].status == "Final") {
							finalPlayers.push(p);
						} else if(teamToLinescore[p.team_id] && teamToLinescore[p.team_id].status == "In Progress") {
							p.battersTillUp = Math.floor((Math.random()*10)+1);
							if(p.dailyStats.bo > 0) {
								console.log(p.name_display_first_last + " " + p.dailyStats.bo);
								atBatPlayers.forEach(function(abp) {
									if(abp.team_id == p.team_id) {
										console.log(abp.dailyStats.bo);
										var pBo = (p.dailyStats.bo - (p.dailyStats.bo % 100)) / 100;
										var abpBo = (abp.dailyStats.bo - (abp.dailyStats.bo % 100)) / 100;
										var pSpot = pBo - abpBo;
										if(pSpot < 0) {
											pSpot = pSpot + 9;
										}
										p.battersTillUp = pSpot;
										p.battersTillUp = Math.floor((Math.random()*10)+1);
									}
								});
							}
							inProgressPlayers.push(p);
						} else {
							previewPlayers.push(p);
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
}

module.exports = {
	getStatsForTeam : getStatsForTeam,
	getGameInfo : getGameInfo
}