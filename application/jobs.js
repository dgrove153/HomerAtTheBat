var CONFIG = require('../config/config').config();
var ASYNC = require('async');
var APPSETTING = require("../models/appSetting");
var SCHEDULE = require('node-schedule');
var PLAYER = require('../models/player');
var PLAYERMLB = require('../application/player/update/mlb');
var PLAYERESPN = require('../application/player/update/espn');
var PLAYERSTATS = require('../application/player/update/stats');

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

//////////
//RUN JOBS
//////////

exports.kickOffJobs = function() {
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
	rule3.hour = 5;
	SCHEDULE.scheduleJob(rule3, function() {
		APPSETTING.findOne({ name : 'isJobsOn' }, function(err, setting) {
			if(setting.value === "true") {
				console.log('clearing daily stats');
				clearDailyStats(function() {
					console.log('donte clearing stats');
				});
			}
		});
	});
}