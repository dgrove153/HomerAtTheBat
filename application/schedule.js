var ASYNC = require('async');
var CONFIG = require("../config/config").config();
var MLB = require("../external/mlb");
var MLBGAME = require("../models/mlbGame");
var TEAM = require("../models/team");
var TEAMSEARCH = require("../application/team/search");

var getSchedule = function(callback, res, next) {
	MLBGAME.getTodaysSchedule(function(games) {
		if(typeof(callback) === "function") {
			callback(games);
		} else {
			res.locals.games = games;
			next();
		}
	});
}

var getPlayersInGames = function(teamId, callback) {
	MLBGAME.getTodaysSchedule(function(games) {
		TEAMSEARCH.getPlayers(CONFIG.year, teamId, false, function(players) {
			games.forEach(function(g) {
				var playersInGame = [];
				players.forEach(function(p) {
					if(p.team_id == g.awayTeamId || p.team_id == g.homeTeamId) {
						playersInGame.push(p);
					}
				});
				g.playersInGame = playersInGame;
			});
			callback(games);
		});
	});
}

var getLinescores = function(games, callback) {
	var linescores = [];
	MLBGAME.getTodaysSchedule(function(games) {
		ASYNC.forEach(games, function(game, innerCB) {
			getLinescore(game.gameday, function(linescore) {
				linescores.push(linescore);
				innerCB();
			});
		}, function() {
			callback(linescores);
		});
	});
}

var getLinescore = function(gameday, callback) {
	MLB.getLinescoreInfo(gameday, callback);
}

module.exports = {
	getLinescores : getLinescores,
	getSchedule : getSchedule,
	getPlayersInGames : getPlayersInGames,
	getLinescore : getLinescore
}