var CONFIG = require("../config/config").config();
var ASYNC = require("async");
var MLB = require("../external/mlb");
var ESPN = require("../external/espn");
var UTIL = require("../application/util");
var MOMENT = require('moment');
var PLAYER = require("../models/player");
var APPSETTING = require("../models/appSetting");

var updatePlayerToTeam = function(callback) {
	var numbers = [];
	APPSETTING.findOne({ name : 'ScoringPeriod_Id' }, function(err, setting) {
		var scoringPeriodId = setting.value;
		APPSETTING.findOne({ name : 'ScoringPeriod_Date' }, function(err, setting) {
			var scoringPeriodDate = new MOMENT(setting.value);
			var now = new MOMENT();
			while(scoringPeriodDate.dayOfYear() < now.dayOfYear()) {
				scoringPeriodId++;
				scoringPeriodDate.add('days', 1);
			}
		})
	})
	for(var i = 1; i < 75; i++) {
		numbers.push(i);
	}
	ASYNC.forEachSeries(numbers, function(num, dayCb) {
		TEAM.find({ teamId : { $ne : 0 }}, function(err, teams) {
			ASYNC.forEachSeries(teams, function(team, cb) {
				console.log("Team: " + team.teamId + ", ScoringPeriod: " + num);
				TEAM.updatePlayerToTeam(team.teamId, num, function() {
					cb();
				});
			}, function() {
				dayCb();
			});
		});
	});
}