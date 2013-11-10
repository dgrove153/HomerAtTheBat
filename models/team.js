var mongoose = require("mongoose");
var Player = require("./player");
var ADMIN = require("../application/admin")
var CONFIG = require("../config/config");
var ASYNC = require("async");

var teamSchema = mongoose.Schema({
	team: String,
	owner: String,
	fullName: String,
	history: [{
		year: Number,
		keeper_total: Number,
		mlb_draft_budget: Number,
		free_agent_draft_budget: Number
	}]
}, { collection: 'teams'});

teamSchema.statics.getList = function(req, res, next) {
	Team.find({}, function(err, teams) {
		if(err) throw err;
		res.locals.teams = teams;
		next();
	});
};

var getPlayersHistorical = function(array, team, year, next) {
	var players = [];

	Player.find({}, function(err, dbPlayers) {
		for(var i = 0; i < dbPlayers.length; i++) {
			var player = dbPlayers[i];
			if(player.history != undefined) {
				for(var j = 0; j < player.history.length; j++) {
					var history = player.history[j];
					if(history.year == year && history.fantasy_team == team) {
						player.history_index = j;
						players.push(player);
					}
				}
			}
		}
		array = players;
		next(array);
	});
}

var getPlayersCurrentYear = function(array, team, next) {
	var year = CONFIG.year;

	var searchArray = {};
	searchArray['history.0.fantasy_team'] = team;
	searchArray['history.0.year'] = year;
	
	var sortArray = {};
	sortArray['history.0.minor_leaguer'] = 1;
	sortArray['history.0.salary'] = -1;
	sortArray['name_display_first_last'] = 1;
	
	Player.find(searchArray).sort(sortArray).exec(function(err, players) {
		for(var i = 0; i < players.length; i++) {
			players[i].history_index = 0;
		}
		array = players;
		next(array);
	});
}

teamSchema.statics.getPlayers = function(year, team, callback) {
	var players = [];
	var index = CONFIG.year - year;
	console.log(CONFIG.year);
	console.log(year);
	console.log(index);
	if(index == 0) {
		ASYNC.series(
			[
				function(cb) {
					getPlayersCurrentYear(players, team, function(array) {
						players = array;
						cb();
					});
				}
			], function(err) {
				if(err) return err;
				console.log("team:" + players.length);
				callback(players);
			}
		);
	} else {
		ASYNC.series(
			[
				function(cb) {
					getPlayersHistorical(players, team, year, function(array) {
						players = array;
						cb();
					});
				}
			], function(err) {
				if(err) return err;
				callback(players);
			}
		);
	}
};

teamSchema.statics.getInfo = function(req, res, next) {
	Team.findOne({ team : req.params.id }, function(err, team) {
		if(err) { throw new Error(err); }
		req.team = team;
		next();
	});
};

var sortByPosition = function(players) {
	var sortedPlayers = {};
	sortedPlayers.catchers = [];
	sortedPlayers.outfielders = [];
	sortedPlayers.pitchers = [];
	sortedPlayers.minor_leaguers = [];
	sortedPlayers.dl = [];
	players.sort(function(a,b) {
		if(a.history[1] == undefined) {
			return -1;
		} else if(b.history[1] == undefined) {
			return 1;
		} else if(a.history[1].salary == undefined) {
			return -1;
		} else if(b.history[1].salary == undefined) {
			return 1;
		} else if(a.history[1].salary > b.history[1].salary) {
			return -1;
		} else if(a.history[1].salary < b.history[1].salary) {
			return 1;
		} else if(a.history[1].salary == b.history[1].salary) {
			return a.name_display_first_last > b.name_display_first_last ? 1 : -1;
		}
	});
	for(var i = 0; i < players.length; i++) {
		var player = players[i];
		var position = player.history_index == 0 ? player.fantasy_position : player.history[player.history_index].fantasy_position;
		switch(position)
		{
			case "C":
				sortedPlayers.catchers.push(players[i]);
				break;
			case "1B":
				sortedPlayers.first_base = players[i];
				break;
			case "2B":
				sortedPlayers.second_base = players[i];
				break;
			case "3B":
				sortedPlayers.third_base = players[i];
				break;
			case "SS":
				sortedPlayers.shortstop = players[i];
				break;
			case "2B/SS":
				sortedPlayers.middle_infield = players[i];
				break;
			case "1B/3B":
				sortedPlayers.corner_infield = players[i];
				break;
			case "OF":
				sortedPlayers.outfielders.push(players[i]);
				break;
			case "UTIL":
				sortedPlayers.utility = players[i];
				break;
			case "P":
				sortedPlayers.pitchers.push(players[i]);
				break;
			case "DL":
				sortedPlayers.dl.push(players[i]);
				break;
			case "Bench":
				sortedPlayers.minor_leaguers.push(players[i]);
				break;
			default:
				sortedPlayers.minor_leaguers.push(players[i]);
		}	
	}
	return sortedPlayers;
};

teamSchema.statics.sortByPosition = sortByPosition;

var Team = mongoose.model('Team', teamSchema);
module.exports = Team;
