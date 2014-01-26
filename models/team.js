var mongoose = require("mongoose");
var PLAYER = require("./player");
var CONFIG = require("../config/config");
var ASYNC = require("async");
var ESPN = require("../external/espn");

var teamSchema = mongoose.Schema({
	team: String,
	owner: String,
	fullName: String,
	history: [{
		year: Number,
		keeper_total: Number,
		mlb_draft_budget: Number,
		free_agent_draft_budget: Number,
		standings: Number
	}]
}, { collection: 'teams'});

/////////////////
//ROUTE FUNCTIONS
/////////////////

teamSchema.statics.getList = function(req, res, next) {
	Team.find({}, function(err, teams) {
		if(err) throw err;
		var teamHash = {};
		teams.forEach(function(team) {
			teamHash[team.team] = team;
		});
		req.teamHash = teamHash;
		res.locals.teamHash = teamHash;
		var year = CONFIG.isOffseason ? CONFIG.year - 1 : CONFIG.year;
		res.locals.teams = sortTeamByStandings(teams, year);
		next();
	});
};

///////////
//STANDINGS
///////////

var sortTeamByStandings = function(teams, year) {
	teams.sort(function(a, b) {
		var ai = findHistoryIndex(a, year);
		var bi = findHistoryIndex(b, year);
		if(a.history && a.history[ai] && a.history[ai].standings &&
			b.history && b.history[bi] && b.history[bi].standings) {
			if(a.history[ai].standings < b.history[bi].standings) {
				return -1;
			} else {
				return 1;
			}
		} else {
			return -1;
		}
	});
	return teams;
}

teamSchema.statics.getStandings_ESPN = function(year, callback) {
	ESPN.getESPNStandings(year, function(teamHash) {
		Team.find({}, function(err, teams) {
			teams.forEach(function(team) {
				var year = CONFIG.isOffseason ? CONFIG.year - 1 : CONFIG.year;
				var historyIndex = findHistoryIndex(team, year);
				if(historyIndex == -1) {
					team.history.unshift({ year : year });
					historyIndex = 0;
				}
				team.history[historyIndex].standings = teamHash[team.fullName];
				team.save();
			});
			callback();
		});
	});
}

////////////////////
//TEAM->PLAYER LISTS
////////////////////

teamSchema.statics.getPlayers = function(year, team, onlyMinorLeaguers, callback) {
	var players = [];
	var yearOffset = CONFIG.year - year;
	if(yearOffset == 0) {
		ASYNC.series(
			[
				function(cb) {
					getPlayersCurrentYear(players, team, onlyMinorLeaguers, function(array) {
						players = array;
						cb();
					});
				}
			], function(err) {
				if(err) return err;
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

var getPlayersHistorical = function(array, team, year, next) {
	var players = [];

	PLAYER.find({}, function(err, dbPlayers) {
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

var getPlayersCurrentYear = function(array, team, onlyMinorLeaguers, next) {
	var year = CONFIG.year;

	var searchArray = {};
	searchArray['history.0.fantasy_team'] = team;
	searchArray['history.0.year'] = year;
	if(onlyMinorLeaguers) {
		searchArray['history.0.minor_leaguer'] = true;
	}
	
	var sortArray = {};
	sortArray['history.0.minor_leaguer'] = 1;
	sortArray['history.0.salary'] = -1;
	sortArray['name_display_first_last'] = 1;
	
	PLAYER.find(searchArray).sort(sortArray).exec(function(err, players) {
		for(var i = 0; i < players.length; i++) {
			players[i].history_index = 0;
		}
		array = players;
		next(array);
	});
}

/////////
//HELPERS
/////////

var findHistoryIndex = function(team, year) {
	if(!team.history) {
		return -1;
	}
	for(var i = 0; i < team.history.length; i++) {
		if(team.history[i].year == year) {
			return i;
		}
	}
	return -1;
}

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

teamSchema.statics.setVultureProperties = function(players) {
	players.forEach(function(player) {
		var isVultured = player.vulture && player.vulture.is_vultured;
		var vulturable = !isVultured && (player.status_code != player.fantasy_status_code) && 
			!player.history[player.history_index].minor_leaguer;
		player.isVultured = isVultured;
		player.vulturable = vulturable;
	});
	return players;
}

teamSchema.statics.setKeeperProperties = function(players) {
	players.forEach(function(player) {
		var nextYearSalary;
		if(player.history[player.history_index].minor_leaguer) { 
			nextYearSalary = 0; 
		} else if(player.history[player.history_index].locked_up) { 
			nextYearSalary = player.history[player.history_index].salary; 
		} else { 
			nextYearSalary = player.history[player.history_index].salary + 3; 
		}
		player.nextYearSalary = nextYearSalary;

		player.checked = player.history[player.history_index].locked_up || player.history[player.history_index].minor_leaguer || 
			(player.history[player.history_index-1] && (player.history[player.history_index-1].keeper_team != undefined &&
				player.history[player.history_index-1].keeper_team != '') || player.history[player.history_index-1].locked_up);
	});
	return players;
}

var Team = mongoose.model('Team', teamSchema);
module.exports = Team;
