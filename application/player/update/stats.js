var ASYNC = require('async');
var AUDIT = require('../../../models/externalAudit');
var CONFIG = require("../../../config/config").config();
var MLB = require("../../../external/mlb");
var MILB = require("../../../external/milb");
var MOMENT = require("moment");
var PLAYER = require("../../../models/player");

var setStatsOnObject = function(obj, isHitter, stats) {
	if(stats) {
		if(isHitter) {
			obj.bo = stats.bo;
			obj.ab = stats.ab;
			obj.r = stats.r;
			obj.rbi = stats.rbi;
			obj.obp = stats.obp;
			obj.sb = stats.sb ? stats.sb : 0;
			obj.hr = stats.hr;
			obj.bb = stats.bb;
			obj.hbp = stats.hbp;
			obj.h2b = stats.h2b;
			obj.h3b = stats.h3b;
			obj.ibb = stats.ibb;
			obj.cs = stats.cs ? stats.cs : 0;
			obj.sac = stats.sac;
			obj.sf = stats.sf;
			obj.go = stats.go;
			obj.ao = stats.ao;
			obj.so = stats.so;
			obj.h = stats.h;
		} else {
			obj.ip = stats.ip;
			obj.s_ip = stats.s_ip;
			obj.w = stats.w;
			obj.so = stats.so;
			if(stats.whip != "-") {
				obj.whip = stats.whip ? stats.whip : 0;
			}
			obj.sv = stats.sv;	
			obj.bb = stats.bb;
			if(stats.era !=  "-.--" && stats.era != "-" && stats.era != "*.**") {
				obj.era = stats.era;
			}
			obj.np = stats.np;
			obj.ibb = stats.ibb;
			obj.er = stats.er;
			obj.ao = stats.ao;
			obj.go = stats.go;
			obj.h = stats.h ? stats.h : 0;
			obj.hr = stats.hr;
			obj.hra = stats.hra;
			obj.r = stats.r;
			obj.k = stats.k;
			obj.hbp = stats.hbp;
		}
	}
}

var setStatsOnPlayer = function(player, stats, statsYear, isHitter) {
	var statsIndex = PLAYER.findStatsIndex(player, statsYear);
	if(statsIndex == -1) {
		player.stats.unshift({ year: statsYear });
		statsIndex = 0;
	}
	setStatsOnObject(player.stats[statsIndex], isHitter, stats);
}

var setDailyStats = function(player, stats, statsYear, isHitter) {
	if(stats) {
		setStatsOnObject(player.dailyStats, isHitter, stats);
	}
}

var switchMinorLeaguerToMajorLeaguer = function(player, historyIndex, stats) {
	player.history[historyIndex].minor_leaguer = false;

	var name = player.name_display_first_last;
	console.log(name + " going from minor leaguer to major leaguer");

	AUDIT.auditMinorLeagueStatusSwitch(player.name_display_first_last, 
		player.history[historyIndex].fantasy_team, "AB: " + stats.ab + ", IP: " + stats.ip);
}

var setMinorLeagueStatus = function(player, historyIndex, isHitter, statsYear) {
	var stats = PLAYER.findStatsIndex(player, statsYear);
	if(player.history[historyIndex] && player.history[historyIndex].minor_leaguer) {
		if(!isHitter) {
			if(stats.ip && stats.ip >= CONFIG.minorLeaguerInningsPitchedThreshhold) {
				switchMinorLeaguerToMajorLeaguer(player, historyIndex, stats);
			}
		} else {
			if(stats.ab && stats.ab >= CONFIG.minorLeaguerAtBatsThreshhold) {
				switchMinorLeaguerToMajorLeaguer(player, historyIndex, stats);
			}
		}
	}
}

var updateStatsHelper = function(search, games, onlyMinorLeaguers, isGameLog, statsFunction, callback) {
	var statsYear = CONFIG.year;
	PLAYER.find(search).sort({name_display_first_last:1}).exec(function(err, players) {
		ASYNC.forEach(players, function(player, cb) {
			if(player.player_id && player.primary_position) {
				
				var isHitter = player.primary_position != 1;
				var historyIndex = PLAYER.findHistoryIndex(player, statsYear);

				if(!onlyMinorLeaguers || player.history[historyIndex].minor_leaguer) {
					console.log('fetching ' + player.name_display_first_last);
					MLB.lookupPlayerStats(player.player_id, isHitter, statsYear, games, isGameLog, function(stats) {
						
						statsFunction(player, stats, statsYear, isHitter);
						setMinorLeagueStatus(player, historyIndex, isHitter, statsYear);
						console.log('done fetching ' + player.name_display_first_last);
						player.save();
						cb();
					});
				} else {
					cb();
				}
			} else {
				console.log(player.name_display_first_last + ', player_id: ' + player.player_id + ', primary_position: ' + player.primary_position);
				cb();
			}
		}, function(err) {
			if(callback) {
				callback(players);
			}
		});
	});
}

exports.updateStats = function(onlyMinorLeaguers, callback) {
	updateStatsHelper({}, 162, onlyMinorLeaguers, false, setStatsOnPlayer, callback);
}

exports.getGameLog = function(player, callback) {
	MLB.lookupPlayerStats(player.player_id, player.primary_position != 1, CONFIG.year, 200, true, function(stats) {
		callback(stats);
	});
}

exports.updateDailyStats = function(games, callback) {
	ASYNC.forEachSeries(games, function(g, gameCB) {
		MLB.lookupDailyStats(g.gameday, function(teams) {
			if(!teams) {
				gameCB();
			} else {
				var stats = teams.batting;
				ASYNC.forEachSeries(stats, function(t, teamCB) {
					ASYNC.forEachSeries(t.batter, function(b, playerCB) {
						PLAYER.findOne({ name_display_first_last : b.name_display_first_last }, function(err, player) {
							if(!player) {
								console.log("COULND'T FIND " + b.name_display_first_last);
								playerCB();
							} else {
								setDailyStats(player, b, undefined, player.primary_position != 1);
								player.save(function() {
									playerCB();
								});
							}
						});
					}, function() {
						teamCB();
					});
				}, function() {
					stats = teams.pitching;
					ASYNC.forEachSeries(stats, function(t, teamCB) {
						ASYNC.forEachSeries(t.pitcher, function(b, playerCB) {
							PLAYER.findOne({ name_display_first_last : b.name_display_first_last }, function(err, player) {
								if(!player) {
									console.log("COULND'T FIND " + b.name_display_first_last);
									playerCB();
								} else {
									setDailyStats(player, b, undefined, player.primary_position != 1);
									player.save(function() {
										playerCB();
									});
								}
							});
						}, function() {
							teamCB();
						});
					}, function() {
						gameCB();	
					});
				});
			}
		});
	}, function() {
		callback();
	});
}

exports.clearDailyStats = function(callback) {
	PLAYER.find({}, function(err, players) {
		players.forEach(function(p) {
			p.dailyStats = undefined;
			p.save();
		});
		callback();
	})
}

exports.getMILBInfo = function(_id, callback) {
	PLAYER.findOne({ _id : _id }, function(err, player) {
		var isHitter = player.primary_position != 1;
		MILB.lookupMinorLeaguer(player.player_id, isHitter, CONFIG.year, function(bio, stats) {
			callback(bio, stats);
		});
	});	
}