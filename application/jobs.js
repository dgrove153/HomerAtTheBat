var CONFIG = require('../config/config').config();
var ASYNC = require('async');
var SCHEDULE = require('node-schedule');
var PLAYER = require('../models/player');
var PLAYERMLB = require('../application/player/update/mlb');
var PLAYERESPN = require('../application/player/update/espn');

//////
//ESPN
//////
var updateESPNRosters = function() {
	PLAYERESPN.updateFromESPNTransactionsPage(function() {
		PLAYERESPN.updatePlayersFromLeaguePage(function(count) {
			console.log("ESPN Players From League Page: " + count);
		});
	});
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
	PLAYERMLB.update(function(count) {
		console.log('SAVED ' + count + ' PLAYERS');
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
		rule.minute = [42, 44, 45, 47, 49];
		
		SCHEDULE.scheduleJob(rule, function() {
			updateESPNRosters();
			//updatePlayerInfo();
			//updateMinorLeagueStatuses();
		});
	}
}