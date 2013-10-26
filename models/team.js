var mongoose = require("mongoose");
var Player = require("./player");
var ADMIN = require("../application/admin")
var CONFIG = require("../config/config");

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
		req.teamList = teams;
		console.log(req.teamList);
		next();
	});
};

teamSchema.statics.getPlayers = function(req, res, next) {
	var id = req.params.id;
	var year = CONFIG.year - req.params.year;
	var searchArray = {};
	searchArray['history.' + year + '.fantasy_team'] = id;
	Player.find(searchArray).sort({'history.1.minor_leaguer': 1, 'history.1.salary':-1, name_display_first_last:1}).exec(function(err, doc) {
		for (var i = doc.length - 1; i >= 0; i--) {
			doc[i].salaryLastYear = Player.getSalaryForYear(doc[i].history, CONFIG.year-1);
			var salaryNextYear = Player.getSalaryForYear(doc[i].history, CONFIG.year);
			var isMinorLeaguer = Player.getMinorLeaguerForYear(doc[i].history, CONFIG.year-1);
			if(salaryNextYear == undefined) {
				if(isMinorLeaguer) {
					salaryNextYear = doc[i].salaryLastYear;
				} else {
					salaryNextYear = doc[i].salaryLastYear + 3;
				}
			}
			doc[i].salaryNextYear = salaryNextYear;

			Player.setVultureProperties(doc[i]);
		};
		req.players = doc;
		next();
	});
};

teamSchema.statics.getInfo = function(req, res, next) {
	Team.findOne({ team : req.params.id }, function(err, team) {
		if(err) { throw new Error(err); }
		req.team = team;
		next();
	});
};

teamSchema.statics.sortByPosition = function(players) {
	var sortedPlayers = {};
	sortedPlayers.catchers = [];
	sortedPlayers.outfielders = [];
	sortedPlayers.pitchers = [];
	sortedPlayers.minor_leaguers = [];
	sortedPlayers.dl = [];
	players.sort(function(a,b) {
		if(a.history[1].salary == undefined) {
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
	})
	for(var i = 0; i < players.length; i++) {
		switch(players[i].fantasy_position)
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

var Team = mongoose.model('Team', teamSchema);
module.exports = Team;
