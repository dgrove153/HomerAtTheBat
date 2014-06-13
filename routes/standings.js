var APP = require("../application/app");
var CONFIG = require('../config/config').config();
var STANDINGS = require("../application/standings");
var TEAM = require('../models/team');

module.exports = function(app, passport){
	app.get("/standings", function(req, res) {
		TEAM.find({ teamId : { $ne : 0 }}, function(err, teams) {
			STANDINGS.calculateStandings(teams, undefined, function(_teams, includedCategories) {
				res.render("standings", { 
					title: "Standings",
					teamsWithPoints : _teams,
					includedCategories : includedCategories
				});
			});
		});
	});

	app.post("/standings", function(req, res) {
		var categories = { battingCategories : [], pitchingCategories : [] };
		categories.battingCategories = req.body.battingCategories;
		categories.pitchingCategories = req.body.pitchingCategories;
		TEAM.find({ teamId : { $ne : 0 }}, function(err, teams) {
			STANDINGS.calculateStandings(teams, categories, function(_teams, includedCategories) {
				res.render("standings", { 
					title: "Standings",
					teamsWithPoints : _teams,
					includedCategories : includedCategories
				});
			});
		});
	});
}
