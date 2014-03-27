var CONFIG = require("../config/config").config();
var MLBGAME = require("../models/mlbGame");
var TEAM = require("../models/team");

var getSchedule = function(req, res, next) {
	MLBGAME.getTodaysSchedule(function(games) {
		res.locals.games = games;
		next();
	});
}

var getPlayersInGames = function(teamId, callback) {
	MLBGAME.getTodaysSchedule(function(games) {
		TEAM.getPlayers(CONFIG.year, teamId, false, function(players) {
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

module.exports = {
	getSchedule : getSchedule,
	getPlayersInGames : getPlayersInGames
}