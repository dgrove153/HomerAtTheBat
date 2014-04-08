var APP = require("../application/app");
var CONFIG = require('../config/config').config();
var STANDINGS = require("../application/standings");
var TEAM = require('../models/team');

module.exports = function(app, passport){
	app.get("/standings", function(req, res) {
		TEAM.find({ teamId : { $ne : 0 }}, function(err, teams) {
			STANDINGS.calculateStandings(teams, function(_teams) {
				res.render("standings", { 
					title: "Standings",
					teamsWithPoints : _teams
				});
			});
		});
	});
}
