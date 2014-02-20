var CONFIG = require('../config/config').config();
var ASYNC = require('async');
var SCHEDULE = require('node-schedule');
var PLAYER = require('../models/player');
var PLAYERMLB = require('../application/player/update/mlb');

//////
//ESPN
//////
var updateESPNRosters = function() {
	ASYNC.series(
	[
		function(cb) {
			PLAYER.updateFromESPNTransactionsPage('all', cb);
		},
		function(cb) {
			PLAYER.updateFromESPNLeaguePage(function(d) {
				console.log(d);
				cb();
			})
		}
	]
	);
}

exports.updateESPNRosters = updateESPNRosters;

/////
//MLB
/////
var updateMinorLeagueStatuses = function() {
	console.log('BEGIN:UPDATE MINOR LEAGUE STATUS');
	PLAYER.updateStats(true, function() {
		console.log('FINISH:UPDATE MINOR LEAGUE STATUS');
	});
}

exports.updateMinorLeagueStatuses = updateMinorLeagueStatuses;

var updatePlayerInfo = function() {
	console.log('BEING:UPDATE MLB PLAYERS');
	PLAYERMLB.updateAll(function(message) {
		console.log('UPDATING MLB PLAYER STATUSES');
	});
}

exports.updatePlayerInfo = updatePlayerInfo;

//////////
//RUN JOBS
//////////

exports.kickOffJobs = function(config) {
	if(config.isJobsOn) {
		console.log("STARTING JOBS...");
		var rule = new SCHEDULE.RecurrenceRule();
		rule.minute = 0;
		
		SCHEDULE.scheduleJob(rule, function() {
			//updateESPNRosters();
			updatePlayerInfo();
			updateMinorLeagueStatuses();
		});
	}
}