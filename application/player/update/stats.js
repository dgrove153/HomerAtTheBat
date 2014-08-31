var ASYNC = require('async');
var AUDIT = require('../../../models/externalAudit');
var CONFIG = require("../../../config/config").config();
var CONSTANTS = require("../../../application/constants");
var MLB = require("../../../external/mlb");
var MILB = require("../../../external/milb");
var MOMENT = require("moment");
var PLAYER = require("../../../models/player");
var PLAYERMINORLEAGUER = require("../../../application/player/minorLeaguer");

var setStatsOnObject = function(obj, isHitter, stats, isDaily) {
	if(stats) {
		if(isHitter) {
			obj.bo = stats.bo;
			obj.ab = stats.ab;
			obj.r = stats.r;
			obj.rbi = stats.rbi;
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
			if(stats.obp) {
				obj.obp = stats.obp;
			} else {
				var obp = (parseInt(stats.h) + parseInt(stats.bb) + parseInt(stats.hbp)) /
					(parseInt(stats.ab) + parseInt(stats.bb) + parseInt(stats.hbp) + parseInt(stats.sf));
				if(!isNaN(obp)) {
					obj.obp = obp;
				}
			}
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
			obj.tbf = stats.tbf;
			if(isDaily) {
				obj.ip = stats.out / 3;
				obj.tbf = stats.tbf;
				obj.whip = (stats.h + stats.bb) / (obj.ip);
				obj.era = (stats.er * 9) / (obj.ip);
			}
		}
	}
}

var setStatsOnPlayer = function(player, stats, statsYear, isHitter) {
	var statsIndex = player.findStatsIndex(statsYear);
	if(statsIndex == -1) {
		player.stats.unshift({ year: statsYear });
		statsIndex = 0;
	}
	setStatsOnObject(player.stats[statsIndex], isHitter, stats, false);
}

var setDailyStats = function(player, stats, statsYear, isHitter) {
	if(stats) {
		setStatsOnObject(player.dailyStats, isHitter, stats, true);
	}
}

var setMinorLeagueStatus = function(player, historyIndex, isHitter, statsYear) {
	var index = player.findStatsIndex(statsYear);
	var stats = player.stats[index];
	if(player.fantasy_status_code == CONSTANTS.StatusCodes.Minors) {
		console.log(player.name_display_first_last + " is a minor leaguer so lets check his status");
		if(!isHitter) {
			if(stats.ip && stats.ip >= CONFIG.minorLeaguerInningsPitchedThreshhold) {
				PLAYERMINORLEAGUER.setMinorLeaguerStatus(player, historyIndex, false, "IP: " + stats.ip);
			}
		} else {
			if(stats.ab && stats.ab >= CONFIG.minorLeaguerAtBatsThreshhold) {
				PLAYERMINORLEAGUER. setMinorLeaguerStatus(player, historyIndex, false, "AB: " + stats.ab);
			}
		}
	}
}

var updateStatsHelper = function(search, games, onlyMinorLeaguers, isGameLog, statsFunction, callback) {
	var statsYear = CONFIG.year;
	var stream = PLAYER.find().stream();
	stream.on('data', function(player) {
		if(player.player_id && player.primary_position) {
			var isHitter = player.primary_position != 1;
			var historyIndex = player.findHistoryIndex(statsYear);
			console.log('fetching ' + player.name_display_first_last);
			MLB.lookupPlayerStats(player.player_id, isHitter, statsYear, games, isGameLog, function(stats) {
				statsFunction(player, stats, statsYear, isHitter);
				setMinorLeagueStatus(player, historyIndex, isHitter, statsYear);
				console.log('done fetching ' + player.name_display_first_last);
				player.save();
			});
		}
	}).on('error', function(err) {
		console.log(err);
	}).on('close', function() {
		callback();
	});
}

exports.updateStats = function(onlyMinorLeaguers, callback) {
	updateStatsHelper({}, 162, onlyMinorLeaguers, false, setStatsOnPlayer, callback);
}

exports.getGameLog = function(player, callback, games) {
	if(games == undefined) {
		games = 200;
	}
	MLB.lookupPlayerStats(player.player_id, player.primary_position != 1, CONFIG.year, games, true, function(stats) {
		callback(stats);
	});
}

exports.updateDailyStats = function(games, callback) {
	ASYNC.forEachSeries(games, function(g, gameCB) {
		var now = Date.parse(new Date());
		var gameTime = Date.parse(g.timeDate);
		if(gameTime > now)  {
			console.log("skipping " + g.gameday + " since it hasn't started yet");
			gameCB();
		} else {
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
		}
	}, function() {
		callback();
	});
}

exports.clearDailyStats = function(callback) {
	PLAYER.find({}, function(err, players) {
		ASYNC.forEach(players, function(p, cb) {
			console.log("clearing daily stats for " + p.name_display_first_last);
			p.dailyStats = undefined;
			p.save(function() {
				cb();
			});
		}, function() {
			callback();
		});
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