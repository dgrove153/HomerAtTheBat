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
	}],
	stats: [{
		year: Number,
		ab: Number,
		ip: Number,
		r: Number,
		rbi: Number,
		obp: Number,
		hr: Number,
		sb: Number,
		w: Number,
		era: Number,
		so: Number,
		whip: Number,
		sv: Number,
		batter_bb: Number,
		pitcher_bb: Number,
		hbp: Number,
		h2b: Number,
		h3b: Number,
		ibb: Number,
		cs: Number,
		sac: Number,
		sf: Number,
		go: Number,
		ao: Number,
		so: Number
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

var getPlayers = function(year, team, onlyMinorLeaguers, callback) {
	var players = [];
	var yearOffset = CONFIG.year - year;
	var players = [];

	var search = { history: { "$elemMatch" : { year: year, fantasy_team : team }}};
	if(onlyMinorLeaguers) {
		search.history['$elemMatch'].minor_leaguer = true;
	}
	PLAYER.find(search).sort({ name_last: 1, name_first: 1}).exec(function(err, dbPlayers) {
		dbPlayers.forEach(function(player) {
			player.history_index = PLAYER.findHistoryIndex(player, year);
			player.stats_index = PLAYER.findStatsIndex(player, year);
		});
		callback(dbPlayers);
	});
};

teamSchema.statics.getPlayers = getPlayers;

teamSchema.statics.updateStats = function(callback) {
	Team.find({ teamId : { $ne : 0 } }, function(err, teams) {
		ASYNC.forEachSeries(teams, function(t, cb) {
			if(t.stats.length == 0) {
				var newStats = createStats();
				t.stats.push(newStats);
			}
			getPlayers(CONFIG.year, t.teamId, false, function(players) {
				ASYNC.forEachSeries(players, function(p, cb2) {
					t.stats.forEach(function(s) {
						if(s.year == CONFIG.year) {
							if(p.dailyStats.game_date) {
								s.ab += p.dailyStats.ab;
								cb2();
							} else {
								cb2();
							}
						}
					});
				}, function() {
					console.log(t.fullName + " " + t.stats);
					cb();
				});
			});
		}, function() {
			if(callback) {
				callback();
			}
		});
	});
}

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
			case "Minors":
				posText = 'minor_leaguers';
				break;
			case "Bench":
				posText = 'bench';
				break;
			default:
				posText = 'bench';
		}
		sortedPlayers[posText].push(players[i]);	
	}
	return sortedPlayers;
};

teamSchema.statics.sortByPosition = sortByPosition;

var createStats = function() {
	return {
		year: CONFIG.year,
		ab : 0,
		ip : 0,
		r : 0,
		rbi : 0,
		obp : 0,
		hr : 0,
		sb : 0,
		w : 0,
		era : 0,
		so : 0,
		whip : 0,
		sv : 0,
		batter_bb : 0,
		pitcher_bb : 0,
		hbp : 0,
		h2b : 0,
		h3b : 0,
		ibb : 0,
		cs : 0,
		sac : 0,
		sf : 0,
		go : 0,
		ao : 0,
		so: 0
	};
}

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
