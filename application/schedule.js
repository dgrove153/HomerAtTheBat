var MLBGAME = require("../models/mlbGame");

var getSchedule = function(req, res, next) {
	MLBGAME.getTodaysSchedule(function(games) {
		res.locals.games = games;
		next();
	});
}

module.exports = {
	getSchedule : getSchedule
}