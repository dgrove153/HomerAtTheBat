var ASYNC = require('async');
var APPSETTING = require("../models/appSetting");
var CONFIG = require('../config/config').config();
var FAA_END = require('../application/freeAgentAuction/endAuction');
var FREEAGENTAUCTION = require('../models/freeAgentAuction');
var MAILER = require('../util/mailer');
var MLBSCHEDULE = require('../application/schedule');
var MOMENT = require('moment');
var PLAYER = require('../models/player');
var PLAYERMLB = require('../application/player/update/mlb');
var PLAYERESPN = require('../application/player/update/espn');
var PLAYERSTATS = require('../application/player/update/stats');
var SCHEDULE = require('node-schedule');
var TEAM = require("../models/team");
var TRADE = require("../models/trade");
var TRADECREATE = require("../application/trade/create");
var VULTURECREATE = require('../application/vulture/create');

//////
//ESPN
//////
var updateESPNRosters = function(callback) {
	console.log("BEGIN:UPDATE ESPN TRANSACTIONS")
	PLAYERESPN.updateFromESPNTransactionsPage(function() {
		console.log("FINISH:UPDATE ESPN TRANSACTIONS");
		console.log("BEGIN:UPDATE ESPN LEAGUE PAGE");
		PLAYERESPN.updatePlayersFromLeaguePage(function(count) {
			console.log("ESPN Players From League Page: " + count);
			console.log("FINISH:UPDATE ESPN LEAGUE PAGE");
			callback();
		});
	});
}

exports.updateESPNRosters = updateESPNRosters;

/////
//MLB
/////
var updateStats = function(callback) {
	console.log('BEGIN:UPDATE MLB STATS');
	PLAYERSTATS.updateStats(false, function() {
		console.log('FINISH:UPDATE MLB STATS');
		callback();
	});
}

var updateMLBPlayers = function(callback) {
	console.log('BEGIN:UPDATE MLB PLAYERS');
	PLAYERMLB.update(function(count) {
		console.log('FINISH: UPDATE MLB PLAYERS, SAVED ' + count + ' PLAYERS');
		callback();
	});
}

var clearDailyStats = function(callback) {
	PLAYERSTATS.clearDailyStats(function() {
		console.log('clearing....');
	});
}

var reschedule = function() {
	FREEAGENTAUCTION.find({ active : true }, function(err, auctions) {
		auctions.forEach(function(auction) {
			var now = MOMENT().add('minutes', 5);
			var oldDeadline = MOMENT(auction.deadline); 
			if(now > oldDeadline) {
				auction.deadline = now;
			}
			FAA_END.scheduleExpiration({ name_display_first_last : auction.player_name}, auction.deadline);
		});
	});

	PLAYER.find({ 'vulture.is_vultured' : true }, function(err, players) {
		ASYNC.forEachSeries(players, function(vPlayer, cb) {
			PLAYER.findOne({ 'vulture.vultured_for_id' : vPlayer._id }, function(err, dPlayer) {
				VULTURECREATE.scheduleExpiration(vPlayer, dPlayer);
				cb();
			});
		});
	});

	TRADE.find({ status : "PROPOSED" }, function(err, trades) {
		trades.forEach(function(trade) {
			TRADECREATE.scheduleExpiration(trade);
		});
	});
}

var innerSchedule = function() {
	MLBSCHEDULE.getSchedule(function(games) {
		console.log("got the schedule");
		if(games && games.length > 0) {
			var earliestGame = undefined;
			games.forEach(function(g) {
				if(earliestGame == undefined) {
					earliestGame = g;
				} else {
					var earliestGameTime = MOMENT(earliestGame.timeDate);
					var thisGameTIme = MOMENT(g.timeDate);
					if(earliestGameTime.hours() + 12 < 24) {
						earliestGameTime.add('hours', 12);
					}
					if(thisGameTIme.hours() + 12 < 24) {
						thisGameTIme.add('hours', 12);
					}
					if(thisGameTIme < earliestGameTime) {
						earliestGame = g;
					}
				}
			});
			var gameTime = MOMENT(earliestGame.timeDate);
			if(gameTime.hours() + 12 < 24) {
				gameTime.add('hours', 12);
			}
			var time = new Date(gameTime);
			console.log("scheduling playerToTeam for " + time);
			if(time > new Date()) {
				SCHEDULE.scheduleJob(time, function() {
					PLAYER.updateTeamByDate(function() {
						MAILER.sendMail({ 
							from: 'Homer Batsman',
							to: [1],
							subject: "Updated Player By Team",
							text: "Updated player by team at " + time
						}); 
						console.log("done updating player to team");
					});
				});
			};
		}
	});
}

var schedulePlayerToTeam = function() {
	var rule = new SCHEDULE.RecurrenceRule();
	rule.hour = 10;
	rule.minute = 0;
	var now = MOMENT();
	if(now.hour() > 10) {
		innerSchedule();
	}
	SCHEDULE.scheduleJob(rule, function() {
		innerSchedule();
	});
}

//////////
//RUN JOBS
//////////

exports.kickOffJobs = function() {
	reschedule();

	schedulePlayerToTeam();

	var rule = new SCHEDULE.RecurrenceRule();
	rule.minute = [0, 10, 20, 30, 40, 50];
	SCHEDULE.scheduleJob(rule, function() {
		APPSETTING.findOne({ name : 'isJobsOn' }, function(err, setting) {
			if(setting.value === "true") {
				console.log("START JOBS....");
				updateMLBPlayers(function() {
					updateESPNRosters(function() {
						console.log("....END JOBS");
					});
				});
			};
		});
	});

	var rule2 = new SCHEDULE.RecurrenceRule();
	rule2.minute = [5];
	SCHEDULE.scheduleJob(rule2, function() {
		APPSETTING.findOne({ name : 'isJobsOn' }, function(err, setting) {
			if(setting.value === "true") {
				console.log('fetching stats');
				updateStats(function() {
					console.log('donte fetching stats');
				});
			}
		});
	});

	var rule3 = new SCHEDULE.RecurrenceRule();
	rule3.hour = 10;
	rule3.minute = 0;
	SCHEDULE.scheduleJob(rule3, function() {
		APPSETTING.findOne({ name : 'isJobsOn' }, function(err, setting) {
			if(setting.value === "true") {
				console.log('clearing daily stats');
				clearDailyStats(function() {
					console.log('done clearing stats');
					console.log('updating 40 man rosters');
					PLAYERMLB.update40ManRosters(function() {
						console.log('done updating 40 man rosters');
					});
				});
			}
		});
	});

	var rule4 = new SCHEDULE.RecurrenceRule();
	rule4.minute = [58];
	SCHEDULE.scheduleJob(rule4, function() {
		APPSETTING.findOne({ name : 'isJobsOn' }, function(err, setting) {
			if(setting.value === "true") {
				console.log('updating ESPN standings');
				TEAM.getStandings_ESPN(CONFIG.year, function() {
					console.log('done updating standings');
				});
			}
		});
	});
}