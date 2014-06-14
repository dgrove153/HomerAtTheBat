var APP = require("../application/app");
var CONFIG = require('../config/config').config();
var STANDINGS = require("../application/standings");
var TEAM = require('../models/team');

module.exports = function(app, passport){
	app.get("/standings", function(req, res) {
		console.log(req.cookies.categories);
		TEAM.find({ teamId : { $ne : 0 }}, function(err, teams) {
			var categories = req.cookies.categories ? req.cookies.categories : undefined;
			STANDINGS.calculateStandings(teams, categories, function(_teams, includedCategories) {
				res.render("standings", { 
					title: "Standings",
					teamsWithPoints : _teams,
					includedCategories : includedCategories
				});
			});
		});
	});

	app.get("/standings/default", function(req, res) {
		res.clearCookie('categories');
		res.redirect("/standings");
	});

	app.post("/standings", function(req, res) {
		var categories = { battingCategories : [], pitchingCategories : [] };
		categories.battingCategories = req.body.battingCategories.length > 0 ? 
			req.body.battingCategories.split(',') :
			[];
		categories.pitchingCategories = req.body.pitchingCategories.length > 0 ?
			req.body.pitchingCategories.split(',') :
			[];
		res.cookie('categories', categories, { maxAge : 1000 * 60 * 60 * 24 });
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
