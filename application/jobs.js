var CONFIG = require('../config/config');
var ASYNC = require('async');
var MLB = require('../external/mlb');
var ESPN = require('../external/espn');
var SCHEDULE = require('node-schedule');
var PLAYER = require('../models/player');

var updateESPN = function() {
	ASYNC.series(
	[
		// function(cb) {
		// 	ESPN.updateESPN_Transactions('all', cb);
		// },
		function(cb) {
			PLAYER.updateFromESPNLeaguePage(function(d) {
				console.log(d);
				cb();
			})
		}
	]
	);
}

if(CONFIG.isUpdateESPNOn) {
	var rule = new SCHEDULE.RecurrenceRule();
	rule.minute = new SCHEDULE.Range(0,59);
	
	SCHEDULE.scheduleJob(rule, function() {
		updateESPN();
	});
}

exports.updateESPN = updateESPN;