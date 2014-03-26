var APP = require("../application/app");
var CONFIGFULL = require('../config/config');
var CONFIG = CONFIGFULL.config();
var PLAYERSTATS = require('../application/player/update/stats');
var TEAM = require('../models/team');

module.exports = function(app, passport){
	app.get("/stattracker/:id?", APP.isUserLoggedIn, function(req, res) {
		var teamId = req.params.id;
		if(!teamId) {
			teamId = req.user.team;
		}
		TEAM.getPlayers(CONFIG.year, teamId, false, function(players) {
			players = TEAM.sortByPosition(players);
			var team = req.teamHash[teamId];
			res.render("stattracker", { 
				title: "StatTracker",
				team: team,
				players: players
			});
		});
	});

	app.get("/stattracker/update/:id", function(req, res) {
		PLAYERSTATS.getDailyStatsForTeam(req.params.id, function(players) {
			res.send(players);
		});
	});

	app.get("/stattracker/delete/all", function(req, res) {
		PLAYERSTATS.clearDailyStats(function() {
			res.send("cleared daily stats");
		})
	})
}
