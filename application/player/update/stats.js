var ASYNC = require('async');
var AUDIT = require('../../../models/externalAudit');
var CONFIG = require("../../../config/config").config();
var MLB = require("../../../external/mlb");
var PLAYER = require("../../../models/player");

var setStatsOnPlayer = function(player, stats, statsYear, isHitter) {
	var statsIndex = PLAYER.findStatsIndex(player, statsYear);
	if(statsIndex == -1) {
		player.stats.unshift({ year: statsYear });
		statsIndex = 0;
	}
	if(stats) {
		if(isHitter) {
			player.stats[statsIndex].ab = stats.ab;
			player.stats[statsIndex].r = stats.r;
			player.stats[statsIndex].rbi = stats.rbi;
			player.stats[statsIndex].obp = stats.obp;
			player.stats[statsIndex].sb = stats.sb;
			player.stats[statsIndex].hr = stats.hr;
			player.stats[statsIndex].bb = stats.bb;
			player.stats[statsIndex].hbp = stats.hbp;
			player.stats[statsIndex].h2b = stats.h2b;
			player.stats[statsIndex].h3b = stats.h3b;
			player.stats[statsIndex].ibb = stats.ibb;
			player.stats[statsIndex].cs = stats.cs;
			player.stats[statsIndex].sac = stats.sac;
			player.stats[statsIndex].sf = stats.sf;
			player.stats[statsIndex].go = stats.go;
			player.stats[statsIndex].ao = stats.ao;
			player.stats[statsIndex].so = stats.so;
		} else {
			player.stats[statsIndex].innings_pitched = stats.ip;
			player.stats[statsIndex].w = stats.w;
			if(stats.era !=  "-.--") {
				player.stats[statsIndex].era = stats.era;
			}
			player.stats[statsIndex].so = stats.so;
			player.stats[statsIndex].whip = stats.whip;
			player.stats[statsIndex].sv = stats.sv;	
		}
	}
}

var switchMinorLeaguerToMajorLeaguer = function(player, historyIndex, stats) {
	player.history[historyIndex].minor_leaguer = false;

	var name = player.name_display_first_last;
	console.log(name + " going from minor leaguer to major leaguer");

	AUDIT.auditMinorLeagueStatusSwitch(player.name_display_first_last, 
		player.history[historyIndex].fantasy_team, "AB: " + stats.ab + ", IP: " + stats.innings_pitched);
}

var setMinorLeagueStatus = function(player, historyIndex, isHitter, statsYear) {
	var stats = PLAYER.findStatsIndex(player, statsYear);
	if(player.history[historyIndex] && player.history[historyIndex].minor_leaguer) {
		if(!isHitter) {
			if(stats.innings_pitched && stats.innings_pitched >= CONFIG.minorLeaguerInningsPitchedThreshhold) {
				switchMinorLeaguerToMajorLeaguer(player, historyIndex, stats);
			}
		} else {
			if(stats.ab && stats.ab >= CONFIG.minorLeaguerAtBatsThreshhold) {
				switchMinorLeaguerToMajorLeaguer(player, historyIndex, stats);
			}
		}
	}
}

exports.updateStats = function(onlyMinorLeaguers, callback) {
	var statsYear = CONFIG.year;
	PLAYER.find({}).sort({name_display_first_last:1}).exec(function(err, players) {
		ASYNC.forEach(players, function(player, cb) {
			if(player.player_id && player.primary_position) {
				
				var isHitter = player.primary_position != 1;
				var historyIndex = PLAYER.findHistoryIndex(player, statsYear);

				if(!onlyMinorLeaguers || player.history[historyIndex].minor_leaguer) {
					console.log('fetching ' + player.name_display_first_last);
					MLB.lookupPlayerStats(player.player_id, isHitter, statsYear, function(stats) {
						
						setStatsOnPlayer(player, stats, statsYear, isHitter);
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
				callback();
			}
		});
	});
}