var APP = require("../application/app");
var CONFIG = require('../config/config').config();
var MOMENT = require("moment");
var STANDINGS = require("../application/standings");
var TEAM = require('../models/team');

module.exports = function(app, passport){
	app.get("/standings", function(req, res) {
		console.log(req.cookies.categories);
		TEAM.find({ teamId : { $ne : 0 }}, function(err, teams) {
			var categories = req.cookies.categories ? req.cookies.categories : undefined;
			STANDINGS.calculateStandings(teams, categories, function(_teams, includedCategories, dates) {
				res.render("standings", { 
					title: "Standings",
					teamsWithPoints : _teams,
					includedCategories : includedCategories,
					dates : dates
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
		var beginDate = req.body.beginDate ? MOMENT(req.body.beginDate).format('L') : undefined;
		var endDate = req.body.endDate ? MOMENT(req.body.endDate).format('L') : undefined;
		if(beginDate || endDate) {
			TEAM.updateStats(function(stats) {
				doCalculateStandings(categories, res);
			}, beginDate, endDate);
		} else {
			doCalculateStandings(categories, res);
		}
	});

	var doCalculateStandings = function(categories, res) {
		res.cookie('categories', categories, { maxAge : 1000 * 60 * 60 * 24 });
		TEAM.find({ teamId : { $ne : 0 }}, function(err, teams) {
			STANDINGS.calculateStandings(teams, categories, function(_teams, includedCategories, dates) {
				res.render("standings", { 
					title: "Standings",
					teamsWithPoints : _teams,
					includedCategories : includedCategories,
					dates : dates
				});
			});
		});
	}
}
