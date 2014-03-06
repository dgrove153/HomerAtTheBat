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
var updateESPNRosters = function() {
	console.log("BEGIN:UPDATE ESPN TRANSACTIONS")
	PLAYERESPN.updateFromESPNTransactionsPage(function() {
		console.log("FINISH:UPDATE ESPN TRANSACTIONS");
		console.log("BEGIN:UPDATE ESPN LEAGUE PAGE");
		PLAYERESPN.updatePlayersFromLeaguePage(function(count) {
			console.log("ESPN Players From League Page: " + count);
			console.log("FINISH:UPDATE ESPN LEAGUE PAGE");
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

//////////
//RUN JOBS
//////////

exports.kickOffJobs = function() {
	var rule = new SCHEDULE.RecurrenceRule();
	rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
	SCHEDULE.scheduleJob(rule, function() {
		APPSETTING.findOne({ name : 'isJobsOn' }, function(err, setting) {
			if(setting.value === "true") {
				console.log("START JOBS....");
				updateMLBPlayers(function() {
					updateStats(function() {
						updateESPNRosters();
					});
				});
			};
		});
	});
}