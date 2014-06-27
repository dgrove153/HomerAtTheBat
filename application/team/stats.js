var ASYNC = require('async');
var PLAYER = require("../../models/player");
var PLAYERSTATS = require("../../application/player/update/stats");
var MOMENT = require("moment");
var TEAM = require("../../models/team");

var updateActive = function(teamId, callback) {
	var playerArray = [];
	PLAYER.find({ teamByDate : { "$elemMatch" : { team : teamId, fantasy_status_code: 'A' } } }, function(err, players) {
		ASYNC.forEach(players, function(player, playerCB) {
			var singlePlayer = {};
			singlePlayer.player = player;
			PLAYERSTATS.getGameLog(player, function(stats) {
				if(!stats || stats == {}) { 
					playerCB(); 
				} else {
					if(stats.constructor == Object) { 
						stats = [ stats ]; 
					}
					ASYNC.forEach(stats, function(gameStat, statCB) {
						var gameDate = MOMENT(gameStat.game_date).format('L');
						ASYNC.forEach(player.teamByDate, function(playerToTeam, teamByDateCB) {
							if(playerToTeam && playerToTeam.date && playerToTeam.team == teamId && playerToTeam.fantasy_status_code == 'A') {
								var playerDate = MOMENT(playerToTeam.date).format('L');
								if(playerDate == gameDate) {
									for(var prop in gameStat) {
										if(gameStat[prop].length > 0 && isFinite(gameStat[prop])) {
											if(!singlePlayer[prop]) {
												singlePlayer[prop] = 0;
											}
											if(player.primary_position == 1) {
												if(prop == 'ip') {
													var innings_pitched = getInningsPitched(gameStat[prop]);
													singlePlayer[prop] += innings_pitched;
												} else {
													if(prop != 'whip' && prop != 'era') {
														singlePlayer[prop] += parseInt(gameStat[prop]);
													}
												}
											} else {
												if(prop != 'obp') {
													singlePlayer[prop] += parseInt(gameStat[prop]);
												}
											}
										}
									}
									teamByDateCB();
								} else {
									teamByDateCB();
								}
							} else {
								teamByDateCB();
							}
						}, function() {
							statCB();
						});
					}, function() {
						if(singlePlayer.player.primary_position != 1) {
							var obp =
								(singlePlayer.h + singlePlayer.bb + singlePlayer.hbp) / 
								(singlePlayer.ab + singlePlayer.bb + singlePlayer.hbp + singlePlayer.sf);
							if(!isNaN(obp)) {
								singlePlayer.obp = obp;
							}
						} else {
							var whip = 
								(singlePlayer.bb + singlePlayer.h) / (singlePlayer.ip);
							if(!isNaN(whip)) {
								singlePlayer.whip = whip;
							}
							var era = 
								(singlePlayer.er * 9) / (singlePlayer.ip);
							if(!isNaN(era)) {
								singlePlayer.era = era;
							}
						}
						playerArray.push(singlePlayer);
						playerCB();
					});
				}
			});
		}, function() {
			callback(playerArray);
		});
	});
}

var getInningsPitched = function(rawInnings) {
	var innArray = rawInnings.split('.');
	var innings_pitched;
	if(isFinite(parseInt(innArray[0]))) {
		innings_pitched = parseInt(innArray[0]);	
	} else {
		innings_pitched = 0;
	}
	if(innArray.length > 1) {
		innings_pitched += parseInt(innArray[1]) / 3;
	}
	return innings_pitched;
}

var resetTeams = function(teamStats, beginDate, endDate, cb) {
	TEAM.find({ teamId : { $ne : 0 } }).sort({ standings: 1}).exec(function(err, teams) {
		ASYNC.forEach(teams, function(t, innerCB) {
			t.stats.lastUpdated = new Date();
			t.stats.beginDate = beginDate;
			t.stats.endDate = endDate;
			for(var stat in t.stats.batting) {
				if(t.stats.batting.hasOwnProperty(stat)) {
					t.stats.batting[stat] = 0;
				}
			}
			for(var stat in t.stats.pitching) {
				if(t.stats.pitching.hasOwnProperty(stat)) {
					t.stats.pitching[stat] = 0;
				}
			}
			teamStats[t.teamId] = t;
			innerCB();
		}, function() {
			cb();
		});
	});
}

var processGameLogs = function(teamStats, beginDate, endDate, cb) {
	PLAYER.find({player_id:{"$exists":true}}, function(err, players) {
		var playerCount = players.length;
		ASYNC.forEach(players, function(player, innerCB) {
			PLAYERSTATS.getGameLog(player, function(stats) {
				playerCount--;
				if(!stats || stats == {}) { innerCB(); return; }
				if(stats.constructor == Object) { stats = [ stats ]; }
				ASYNC.forEach(stats, function(gameStat, statCB) {
					var gameDate = MOMENT(gameStat.game_date).format('L');
					var isDateInRange = 
						(!endDate && !beginDate) ||
						(!beginDate && gameDate <= endDate) ||
						(!endDate && gameDate >= beginDate) ||
						(gameDate >= beginDate && gameDate <= endDate);
					if(isDateInRange) {
						ASYNC.forEach(player.teamByDate, function(playerToTeam, playerCB) {
							if(playerToTeam && playerToTeam.date && playerToTeam.team && playerToTeam.fantasy_status_code == 'A') {
								var playerDate = MOMENT(playerToTeam.date).format('L');
								if(playerDate == gameDate) {
									// FOR DEBUGGING PURPOSES
									// if(playerToTeam.team == 9 && player.primary_position == 1) {
									// 	if(playerToAbs[player.name_display_first_last] == undefined) {
									// 		playerToAbs[player.name_display_first_last] = 0;
									// 	}
									// 	playerToAbs[player.name_display_first_last] += parseInt(gameStat['w']);
									// 	console.log(player.name_display_first_last + " " + gameDate + " " + gameStat['w']);
									// }
									for(var prop in gameStat) {
										var team = playerToTeam.team;
										if(player.primary_position == 1) {
											if(teamStats[team].stats.pitching.hasOwnProperty(prop) && gameStat[prop].length > 0 && isFinite(gameStat[prop])) {
												if(prop == 'ip') {
													var innings_pitched = getInningsPitched(gameStat[prop]);
													teamStats[team].stats.pitching[prop] += innings_pitched;
													if(gameStat['gs'] == 1 && innings_pitched >= 6 && gameStat['er'] <= 3) {
														//console.log(player.name_display_first_last + " " + gameDate + " " + innings_pitched + " " + gameStat['er']);
														teamStats[team].stats.pitching['qs'] += 1;
													}
												} else {
													if(prop != 'whip' && prop != 'era') {
														teamStats[team].stats.pitching[prop] += parseInt(gameStat[prop]);
													}
												}
											}
										} else {
											if(teamStats[team].stats.batting.hasOwnProperty(prop) && gameStat[prop].length > 0 && isFinite(gameStat[prop])) {
												if(prop != 'obp') {
													teamStats[team].stats.batting[prop] += parseInt(gameStat[prop]);
												}
											}
										}
									}
								}	
							}
							playerCB();
						}, function() {
							statCB();
						});
					} else {
						statCB();
					}
				});
				innerCB();
			});
		}, function() {
			cb();
		});
	});
}

var addAdditionalStatsAndSave = function(teamStats, callback) {
	var teamsToSave = [];
	for(var team in teamStats) {
		teamsToSave.push(team);
	}
	ASYNC.forEach(teamsToSave, function(team, ariCB) {
		var obp =
			(teamStats[team].stats.batting.h + teamStats[team].stats.batting.bb + teamStats[team].stats.batting.hbp) / 
			(teamStats[team].stats.batting.ab + teamStats[team].stats.batting.bb + teamStats[team].stats.batting.hbp + teamStats[team].stats.batting.sf);
		if(!isNaN(obp)) {
			teamStats[team].stats.batting.obp = obp;
		}

		var sbp =
			(teamStats[team].stats.batting.sb / (teamStats[team].stats.batting.sb + teamStats[team].stats.batting.cs));
		if(!isNaN(sbp)) {
			teamStats[team].stats.batting.sbp = sbp;
		}

		var battingStats = teamStats[team].stats.batting;
		var h1b = battingStats.h - battingStats.h2b - battingStats.h3b - battingStats.hr;
		var woba = 
			(0.693*battingStats.bb + 0.725*battingStats.hbp + 0.892*h1b + 1.279*battingStats.h2b + 1.627*battingStats.h3b +
			2.118*battingStats.hr) / (battingStats.ab + battingStats.bb - battingStats.ibb + battingStats.sf + battingStats.hbp);
		if(!isNaN(woba)) {
			battingStats.woba = woba;
		}

		var babip =
			(battingStats.h - battingStats.hr) / (battingStats.ab - battingStats.so - battingStats.hr + battingStats.sf);
		if(!isNaN(babip)) {
			battingStats.babip = babip;
		}

		var whip = 
			(teamStats[team].stats.pitching.bb + teamStats[team].stats.pitching.h) / (teamStats[team].stats.pitching.ip);
		if(!isNaN(whip)) {
			teamStats[team].stats.pitching.whip = whip;
		}
		var era = 
			(teamStats[team].stats.pitching.er * 9) / (teamStats[team].stats.pitching.ip);
		if(!isNaN(era)) {
			teamStats[team].stats.pitching.era = era;
		}
		var kPerNine = 
			(teamStats[team].stats.pitching.so * 9) / (teamStats[team].stats.pitching.ip);
		if(!isNaN(kPerNine)) {
			teamStats[team].stats.pitching.kPerNine = kPerNine;
		}

		var kPerWalk =
			(teamStats[team].stats.pitching.so) / (teamStats[team].stats.pitching.bb);
		if(!isNaN(kPerWalk)) {
			teamStats[team].stats.pitching.kPerWalk = kPerWalk;
		}

		var goao =
			(teamStats[team].stats.pitching.go) / (teamStats[team].stats.pitching.ao);
		if(!isNaN(goao)) {
			teamStats[team].stats.pitching.goao = goao;
		}

		var kPercentage =
			(teamStats[team].stats.pitching.so)  / (teamStats[team].stats.pitching.tbf);
		if(!isNaN(kPercentage)) {
			teamStats[team].stats.pitching.kPercentage = kPercentage;
		}
		var bbPercentage =
			(teamStats[team].stats.pitching.bb)  / (teamStats[team].stats.pitching.tbf);
		if(!isNaN(bbPercentage)) {
			teamStats[team].stats.pitching.bbPercentage = bbPercentage;
		}

		var kPMinusbbP =
			(teamStats[team].stats.pitching.kPercentage) - (teamStats[team].stats.pitching.bbPercentage);
		if(!isNaN(kPMinusbbP)) {
			teamStats[team].stats.pitching.kPMinusbbP = kPMinusbbP;
		}

		var fip =
			((13*teamStats[team].stats.pitching.hr)+(3*(teamStats[team].stats.pitching.bb+teamStats[team].stats.pitching.hb))-
				(2*teamStats[team].stats.pitching.so))/teamStats[team].stats.pitching.ip + 3.086;
		if(!isNaN(fip)) {
			teamStats[team].stats.pitching.fip = fip;
		}

		teamStats[team].save(function(data) {
			ariCB();
		});
	}, function() {
		callback(teamStats);
	});
}

var updateTeamSeason = function(callback, beginDate, endDate) {
	var playerToAbs = {};
	var teamStats = {};
	ASYNC.series([
		function(cb) {
			resetTeams(teamStats, beginDate, endDate, cb);
		},
		function(cb) {
			processGameLogs(teamStats, beginDate, endDate, cb);
		}, 
		function(cb) {
			addAdditionalStatsAndSave(teamStats, callback);
		}
	]);
}

module.exports = {
	updateActive : updateActive,
	updateTeamSeason : updateTeamSeason
}