var TEAM = require('../models/team');
var ASSET = require('../models/asset');
var CONFIG = require('../config/config');
var VULTURE = require("../application/vulture");

module.exports = function(app, passport){
	app.get("/team", function(req, res) {
		if(req.user != undefined) {
			res.redirect('/team/' + req.user.team);
		} else {
			res.redirect('/');
		}
	});

	app.get("/team/:id", TEAM.getInfo, ASSET.findForTeam, VULTURE.getVulturesForTeam, function (req, res) {
		res.redirect('/team/' + req.params.id + '/' + CONFIG.year);
	});

	app.get("/team/:id/:year", TEAM.getInfo, ASSET.findForTeam, VULTURE.getVulturesForTeam, function (req, res) {
		TEAM.getPlayers(req, res, function() {
			req.players = TEAM.sortByPosition(req.players);
			res.render("team", { 
				isOffseason: CONFIG.isOffseason,
				year: req.params.year, 
				players: req.players, 
				team: req.team, 
				assets : req.assets, 
				vultures: req.open_vultures,
				isTeamOwner: req.user != null && req.user.team == req.team.team
			} );
		});
	});
}
