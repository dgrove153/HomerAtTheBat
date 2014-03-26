var ASYNC = require('async');
var AUDIT = require('../../../models/externalAudit');
var CONFIG = require("../../../config/config").config();
var MLB = require("../../../external/mlb");
var MOMENT = require("moment");
var PLAYER = require("../../../models/player");

var setStatsOnObject = function(obj, isHitter, stats) {
	if(stats) {
		if(isHitter) {
			obj.ab = stats.ab;
			obj.r = stats.r;
			obj.rbi = stats.rbi;
			obj.obp = stats.obp;
			obj.sb = stats.sb;
			obj.hr = stats.hr;
			obj.bb = stats.bb;
			obj.hbp = stats.hbp;
			obj.h2b = stats.h2b;
			obj.h3b = stats.h3b;
			obj.ibb = stats.ibb;
			obj.cs = stats.cs;
			obj.sac = stats.sac;
			obj.sf = stats.sf;
			obj.go = stats.go;
			obj.ao = stats.ao;
			obj.so = stats.so;
		} else {
			obj.ip = stats.ip;
			obj.w = stats.w;
			obj.so = stats.so;
			obj.whip = stats.whip;
			obj.sv = stats.sv;	
			obj.bb = stats.bb;
			if(stats.era !=  "-.--") {
				obj.era = stats.era;
			}
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
		var date = MOMENT(stats.game_date).format('L');
		var today = MOMENT().subtract('hours', 6).format('L');
		if(date == today) {
			setStatsOnObject(player.dailyStats, isHitter, stats);
			player.dailyStats.game_date = stats.game_date;
		}
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

var updateStatsHelper = function(search, games, onlyMinorLeaguers, isDaily, statsFunction, callback) {
	var statsYear = CONFIG.year;
	PLAYER.find(search).sort({name_display_first_last:1}).exec(function(err, players) {
		ASYNC.forEach(players, function(player, cb) {
			if(player.player_id && player.primary_position) {
				
				var isHitter = player.primary_position != 1;
				var historyIndex = PLAYER.findHistoryIndex(player, statsYear);

				if(!onlyMinorLeaguers || player.history[historyIndex].minor_leaguer) {
					console.log('fetching ' + player.name_display_first_last);
					MLB.lookupPlayerStats(player.player_id, isHitter, statsYear, games, isDaily, function(stats) {
						
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
	updateStatsHelper({}, 200, onlyMinorLeaguers, false, setStatsOnPlayer, callback);
}

exports.getDailyStatsForTeam = function(team, callback) {
	var statsYear = CONFIG.year;
	var search = { history: { "$elemMatch" : { year: statsYear, fantasy_team : team }}};
	updateStatsHelper(search, 1, false, true, setDailyStats, callback);
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