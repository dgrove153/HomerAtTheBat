var ASYNC = require("async");
var MOMENT = require('moment');
var APPSETTING = require("../models/appSetting");
var TEAM = require("../models/team");

var updatePlayerToTeam = function(callback) {
	var missingScoringPeriods = [];
	APPSETTING.findOne({ name : 'ScoringPeriod_Id' }, function(err, idSetting) {
		var scoringPeriodId = idSetting.value;
		APPSETTING.findOne({ name : 'ScoringPeriod_Date' }, function(err, dateSetting) {
			var scoringPeriodDate = new MOMENT(dateSetting.value);
			var now = new MOMENT();
			while(scoringPeriodDate.dayOfYear() < now.dayOfYear()) {
				console.log(scoringPeriodDate.toDate());
				console.log("NOW: " + now.toDate());
				scoringPeriodId++;
				missingScoringPeriods.push(scoringPeriodId);
				scoringPeriodDate.add('days', 1);
			}
			dateSetting.value = scoringPeriodDate;
			idSetting.value = scoringPeriodId;
			dateSetting.save();
			idSetting.save();
			ASYNC.forEachSeries(missingScoringPeriods, function(num, dayCb) {
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