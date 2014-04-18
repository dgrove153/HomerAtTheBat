var APP = require("../application/app");
var CONFIG = require('../config/config').config();
var SCHEDULE = require("../application/schedule");
var PLAYER = require("../models/player");
var PLAYERSTATS = require('../application/player/update/stats');

var getStatsForTeam = function(team, callback) {
	SCHEDULE.getSchedule(function(games) {
		PLAYERSTATS.updateDailyStats(games, function() {
			var statsYear = CONFIG.year;
			var search = { history: { "$elemMatch" : { year: statsYear, fantasy_team : team }}};
			PLAYER.find(search, function(err, players) {
				callback(players);
			});
		});
	});
}

var getGameInfo = function(team, callback) {
	var playerIds = [];
	SCHEDULE.getSchedule(function(games) {
		SCHEDULE.getLinescores(games, function(linescores) {
			linescores.forEach(function(l) {
				if(l.current_batter && l.due_up_batter) {
					playerIds.push(l.current_batter.id);
					playerIds.push(l.due_up_batter.id);
				}
			});
			var statsYear = CONFIG.year;
			var search = { history: { "$elemMatch" : { year: statsYear, fantasy_team : team }}};
			PLAYER.find(search, function(err, players) {
				PLAYER.find({ player_id : { "$in" : playerIds }}, function(err, atBatPlayers) {
					players.forEach(function(p) {
						p.battersTillUp = -1;
						if(p.dailyStats.bo > 0) {
							atBatPlayers.forEach(function(abp) {
								if(abp.team_id == p.team_id) {
									var pBo = (p.dailyStats.bo - (p.dailyStats.bo % 100)) / 100;
									var abpBo = (abp.dailyStats.bo - (abp.dailyStats.bo % 100)) / 100;
									var pSpot = pBo - abpBo;
									if(pSpot < 0) {
										pSpot = pSpot + 9;
									}
									p.battersTillUp = pSpot;
								}
							});
						}
					});
					players.sort(function(a, b) {
						if(a.battersTillUp == -1) {
							return 1;
						}
						if(b.battersTillUp == -1) {
							return -1;
						}
						return a.battersTillUp - b.battersTillUp;
					});
					callback(players);
				});
			});
		});
	});
}

module.exports = {
	getStatsForTeam : getStatsForTeam,
	getGameInfo : getGameInfo
}