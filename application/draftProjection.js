var CONFIG = require("../config/config").config();
var PLAYER = require("../models/player");
var DRAFTPROJECTION = require("../models/draftProjection");
var ASYNC = require('async');

exports.init = function() {
	DRAFTPROJECTION.find({}, function(err, projections) {
		var count = 0;
		ASYNC.forEachSeries(projections, function(projection, cb) {
			PLAYER.findOne({ name_display_first_last : projection.Name }, function(err, player) {
				if(player) {
					var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
					projection.team = player.history[historyIndex].fantasy_team;
					projection.save(function() {
						console.log("added " + projection.Name + " to " + projection.team);
						cb();
					});
					count++;
				} else {
					console.log("No projection for " + projection.Name);
					cb();
					count++;
				}
			});
		}, function(err) {
			console.log("Total: " + count);
		});
	});
};

exports.reset = function() {
	DRAFTPROJECTION.find({}, function(err, projections) {
		projections.forEach(function(projection) {
			projection.team = undefined;
			projection.save();
		});
	})
};

exports.sumStatsForTeam = function() {
	DRAFTPROJECTION.find({}, function(err, projections) {
		var statsHash = {};
		projections.forEach(function(player) {
			if(player.team != undefined) {
				if(!statsHash[player.team]) {
					statsHash[player.team] = {};
				}
				var projection = player.stats[0];
				var json = projection.toJSON();
				for(var prop in json) {
					if(prop == 'source') {

					} else {
						if(!statsHash[player.team][prop]) {
							statsHash[player.team][prop] = json[prop];
						} else {
							statsHash[player.team][prop] += parseFloat(json[prop]);
						}
					}
				}
			}
		});
		var hrPoints = [];
		for(var team in statsHash) {
			if(team != 0) {
				hrPoints.push({team:team,value:statsHash[team]['HR']});	
			}
		}
		hrPoints = hrPoints.sort(function(a, b) {
			return a.value - b.value;
		});
		for(var i = 11; i >= 0; i--) {
			console.log("Team: " + hrPoints[i].team + ", HR: " + hrPoints[i].value + ", Points: " + parseInt(i + 1));
		}
	});
}