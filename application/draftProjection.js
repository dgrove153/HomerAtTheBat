var USER = require("../models/user");
var CONFIG = require("../config/config").config();
var PLAYER = require("../models/player");
var DRAFTPROJECTION = require("../models/draftProjection");
var ASYNC = require('async');

exports.init = function() {
	USER.find({}, function(err, users) {
		DRAFTPROJECTION.find({}, function(err, projections) {
			var count = 0;
			ASYNC.forEachSeries(projections, function(projection, cb) {
				PLAYER.findOne({ name_display_first_last : projection.Name }, function(err, player) {
					if(player) {
						player.fangraphsId = projection.playerid;
						player.save();

						var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
						users.forEach(function(user) {
							projection.team.push({ 
								user: user.email, 
								team: player.history[historyIndex].fantasy_team
							});
						});
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

var putPlayersOnTeam = function(draftProjections, cb) {
	var projectionHash = {};
	PLAYER.find({}, function(err, players) {
		draftProjections.forEach(function(projection) {
			projectionHash[projection.Name] = projection;
		});
		players.forEach(function(player) {
			if(projectionHash[player.name_display_first_last]) {
				var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
				projectionHash[player.name_display_first_last].team = player.history[historyIndex].fantasy_team;
			}
		});
		var projectionArray = [];
		for(var player in projectionHash) {
			projectionArray.push(projectionHash[player]);
		}
		cb(projectionArray);
	});
}

exports.getPlayersOnTeam = function(req, res, next) {
	//var user = req.user.email;
	//var team = req.user.team;
	var user = "arigolub@gmail.com";
	var team = 1;
	var search = { team: { "$elemMatch" : { user: user, team : team }}};
	DRAFTPROJECTION.find(search, 'playerid', function(err, playerids) {
		console.log(playerids);
		var fangraphsIds = [];
		playerids.forEach(function(id) {
			fangraphsIds.push(id.playerid);
		});
		PLAYER.find({ fangraphsId : { $in : fangraphsIds } }, function(err, players) {
			players.forEach(function(player) {
				player.history_index = 0;
			})
			req.teamPlayers = players;
			next();
		});
	});
}

exports.sumStatsForTeam = function(source, cb) {
	var user = "arigolub@gmail.com";
	DRAFTPROJECTION.find({team:{$exists:true}}).sort({Name:1}).exec(function(err, projections) {
		var statsHash = {};
		var teamOfPlayersHash = {};
		projections.forEach(function(player) {
			var team = DRAFTPROJECTION.findTeam(player, user);
			if(team) {
				if(!statsHash[team]) {
					statsHash[team] = {};
				}
				if(!teamOfPlayersHash[team]) {
					teamOfPlayersHash[team] = [];
				}
				teamOfPlayersHash[team].push(player);
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
							if(!statsHash[team][prop]) {
								statsHash[team][prop] = json[prop];
							} else {
								statsHash[team][prop] += parseFloat(json[prop]);
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
				parseFloat(
					(statsHash[team]['H'] + statsHash[team]['BB'] + statsHash[team]['HBP']) / 
					(statsHash[team]['AB'] + statsHash[team]['BB'] + statsHash[team]['HBP'])
				).toFixed(4).substr(1);
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
		cb(teamOfPlayersHash, teamPoints, projections);
	});
}