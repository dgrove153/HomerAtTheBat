var APP = require("../application/app");
var CONFIGFULL = require('../config/config');
var CONFIG = CONFIGFULL.config();
var PLAYER = require('../models/player');
var TEAM = require('../models/team');

module.exports = function(app, passport){
	app.get("/stattracker", APP.isUserLoggedIn, function(req, res) {
		TEAM.getPlayers(CONFIG.year, req.user.team, false, function(players) {
			players = TEAM.sortByPosition(players);
			var team = req.teamHash[req.user.team];
			res.render("stattracker", { 
				title: "StatTracker",
				team: team,
				players: players
			});
		});
	});

	app.get("/stattracker/:id", function(req, res) {
		PLAYER.find({ 'history.0.fantasy_team' : req.params.id }, function(err, players) {
			res.send(players);
		});
	});
}
