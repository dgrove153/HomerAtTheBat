var CONFIG = require("../config/config").config();
var ASYNC = require("async");
var MLB = require("../external/mlb");
var ESPN = require("../external/espn");
var UTIL = require("../application/util");
var MOMENT = require('moment');
var PLAYER = require("../models/player");
var APPSETTING = require("../models/appSetting");
var TEAM = require("../models/team");

var updatePlayerToTeam = function(callback) {
	var numbers = [];
	APPSETTING.findOne({ name : 'ScoringPeriod_Id' }, function(err, idSetting) {
		var scoringPeriodId = idSetting.value;
		APPSETTING.findOne({ name : 'ScoringPeriod_Date' }, function(err, dateSetting) {
			var scoringPeriodDate = new MOMENT(dateSetting.value);
			var now = new MOMENT();
			while(scoringPeriodDate.dayOfYear() < now.dayOfYear()) {
				console.log(scoringPeriodDate.toDate());
				console.log("NOW: " + now.toDate());
				scoringPeriodId++;
				numbers.push(scoringPeriodId);
				scoringPeriodDate.add('days', 1);
			}
			dateSetting.value = scoringPeriodDate;
			idSetting.value = scoringPeriodId;
			dateSetting.save();
			idSetting.save();
			ASYNC.forEachSeries(numbers, function(num, dayCb) {
				TEAM.find({ teamId : { $ne : 0 }}, function(err, teams) {
					ASYNC.forEachSeries(teams, function(team, cb) {
						TEAM.updatePlayerToTeam(team.teamId, num, function() {
							cb();
						});
					}, function() {
						dayCb();
					});
				});
			}, function() {
				callback();
			});
		});
	});
}

module.exports = {
	updatePlayerToTeam : updatePlayerToTeam
}