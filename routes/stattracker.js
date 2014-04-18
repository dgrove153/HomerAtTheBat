var APP = require("../application/app");
var CONFIG = require('../config/config').config();
var PLAYERSTATS = require('../application/player/update/stats');
var SCHEDULE = require("../application/schedule");
var STATTRACKER = require("../application/stattracker");
var TEAM = require('../models/team');

module.exports = function(app, passport){
	app.get("/stattracker/:id?", APP.isUserLoggedIn, SCHEDULE.getSchedule, function(req, res) {
		var teamId = req.params.id;
		if(!teamId) {
			teamId = req.user.team;
		}
		TEAM.getPlayers(CONFIG.year, teamId, false, function(players) {
			var unsortedPlayers = players;
			players = TEAM.sortByPosition(players);
			var team = req.teamHash[teamId];
			res.render("stattracker2", { 
				title: "StatTracker",
				team: team,
				players: players,
				unsortedPlayers : unsortedPlayers
			});
		});
	});

	app.get("/stattracker/update/:id", function(req, res) {
		STATTRACKER.getStatsForTeam(req.params.id, function(players) {
			res.send(players);
		});
	});

	app.get("/stattracker/delete/all", function(req, res) {
		PLAYERSTATS.clearDailyStats(function() {
			res.send("cleared daily stats");
		})
	});

	app.get("/stattracker/linescore/:gameday", function(req, res) {
		SCHEDULE.getLinescore(req.params.gameday, function(linescore) {
			res.send(linescore);
		});
	});

	app.get("/stattracker/linescore2/:id", function(req, res) {
		STATTRACKER.getGameInfo(req.params.id, function(previewPlayers, inProgressPlayers, finalPlayers) {
			res.render("partials/stattrackerDiv", {
				previewPlayers : previewPlayers,
				inProgressPlayers : inProgressPlayers,
				finalPlayers : finalPlayers
			}, function(err, html) {
				res.send({ html : html, previewPlayers : previewPlayers, inProgressPlayers : inProgressPlayers, finalPlayers : finalPlayers });
			});
		});
	})
}
