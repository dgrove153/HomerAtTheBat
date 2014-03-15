var mongoose = require("mongoose");
var PLAYER = require("./player");
var CONFIG = require("../config/config").config();
var ASYNC = require("async");
var ESPN = require("../external/espn");

var teamSchema = mongoose.Schema({
	teamId: Number,
	team: String,
	owner: String,
	fullName: String,
	preKeeperCash: Number,
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
	Team.find({}).sort({'history.0.standings':1,teamId:1}).exec(function(err, teams) {
		if(err) throw err;
		var teamHash = {};
		teams.forEach(function(team) {
			teamHash[team.teamId] = team;
		});
		req.teamHash = teamHash;
		res.locals.teamHash = teamHash;
		var year = CONFIG.isOffseason ? CONFIG.year - 1 : CONFIG.year;
		res.locals.teams = teams;
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
				var historyIndex = findHistoryIndex(team, year);
				if(historyIndex == -1) {
					team.history.unshift({ year : year });
					historyIndex = 0;
				}
				team.history[historyIndex].standings = teamHash[team.teamId];
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
	var players = [];

	var search = { history: { "$elemMatch" : { year: year, fantasy_team : team }}};
	if(onlyMinorLeaguers) {
		search.history['$elemMatch'].minor_leaguer = true;
	}
	PLAYER.find(search, function(err, dbPlayers) {
		dbPlayers.forEach(function(player) {
			player.history_index = PLAYER.findHistoryIndex(player, year);
		});
		callback(dbPlayers);
	});
};

/////////
//HELPERS
/////////

var findHistoryIndex = function(player, year) {
	if(!player.history) {
		return -1;
	}
	for(var i = 0; i < player.history.length; i++) {
		if(player.history[i].year == year) {
			return i;
		}
	}
	return -1;
}

var sortByPosition = function(players) {
	var sortedPlayers = {};

	sortedPlayers.catchers = [];
	sortedPlayers.first_base = [];
	sortedPlayers.second_base = [];
	sortedPlayers.third_base = [];
	sortedPlayers.shortstop = [];
	sortedPlayers.middle_infield = [];
	sortedPlayers.corner_infield = [];
	sortedPlayers.outfielders = [];
	sortedPlayers.utility = [];
	sortedPlayers.pitchers = [];
	sortedPlayers.minor_leaguers = [];
	sortedPlayers.dl = [];
	sortedPlayers.bench = [];

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
		var position = player.history[player.history_index].fantasy_position;
		var posText = undefined;
		switch(position)
		{
			case "C":
				posText = 'catchers';
				break;
			case "1B":
				posText = 'first_base';
				break;
			case "2B":
				posText = 'second_base';
				break;
			case "3B":
				posText = 'third_base';
				break;
			case "SS":
				posText = 'shortstop';
				break;
			case "2B/SS":
				posText = 'middle_infield';
				break;
			case "1B/3B":
				posText = 'corner_infield';
				break;
			case "OF":
				posText = 'outfielders';
				break;
			case "UTIL":
				posText = 'utility';
				break;
			case "P":
				posText = 'pitchers';
				break;
			case "DL":
				posText = 'dl';
				break;
			case "Bench":
				posText = 'minor_leaguers';
				break;
			default:
				posText = 'minor_leaguers';
		}
		sortedPlayers[posText].push(players[i]);	
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

var Team = mongoose.model('Team', teamSchema);
module.exports = Team;
