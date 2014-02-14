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

exports.sumStatsForTeam = function(source, cb) {
	DRAFTPROJECTION.find({team:{$exists:true}}, function(err, projections) {
		var statsHash = {};
		var teamOfPlayersHash = {};
		projections.forEach(function(player) {
			if(player.team) {
				if(!statsHash[player.team]) {
					statsHash[player.team] = {};
				}
				if(!teamOfPlayersHash[player.team]) {
					teamOfPlayersHash[player.team] = [];
				}
				teamOfPlayersHash[player.team].push(player);
				var projection;
				player.stats.forEach(function(stat) {
					if(stat.source == source) {
						projection = stat;
					}
				});
				if(projection) {
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
			}
		});
		var categories = ['HR','R','RBI','SB', 'OBP'];
		var teamPoints = [];
		for(var team in statsHash) {
			teamPoints.push({team:team,points:0});
			statsHash[team]['OBP'] = 
				(statsHash[team]['H'] + statsHash[team]['BB'] + statsHash[team]['HBP']) / 
				(statsHash[team]['AB'] + statsHash[team]['BB'] + statsHash[team]['HBP']);
		}
		for(var i = 0; i < categories.length; i++) {
			var category = categories[i];
			var statArray = [];
			teamPoints.forEach(function(team) {
				statArray.push({team:team.team,value:statsHash[team.team][category]});
			});
			statArray.sort(function(a, b) {
				return b.value - a.value;
			});
			var points = 12;
			statArray.forEach(function(team) {
				teamPoints.forEach(function(teamPoint) {
					if(teamPoint.team == team.team) {
						teamPoint.points += points;
						teamPoint[category] = { points: points, count: team.value };
					}
				});
				points--;
			});
		}
		teamPoints.sort(function(a, b) {
			return b.points - a.points;
		});
		for(var i = 1; i <= 12; i++) {
			teamPoints[i-1].standing = i;
		}
		cb(teamOfPlayersHash, teamPoints);
	});
}