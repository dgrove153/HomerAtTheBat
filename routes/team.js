var TEAM = require('../models/team');
var ASSET = require('../models/asset');
var CONFIG = require('../config/config');
var VULTURE = require('../application/vulture');
var MLDP = require('../models/minorLeagueDraftPick');

module.exports = function(app, passport){
	app.get("/team", function(req, res) {
		if(req.user != undefined) {
			res.redirect('/team/' + req.user.team);
		} else {
			res.redirect('/');
		}
	});

	app.get("/team/:id", TEAM.getInfo, ASSET.findForTeam, MLDP.findForTeam, VULTURE.getVulturesForTeam, function (req, res) {
		TEAM.getPlayers(CONFIG.year, req, res, function() {
			req.players = TEAM.sortByPosition(req.players);
			res.render("team", { 
				year: CONFIG.year, 
				players: req.players, 
				team: req.team, 
				picks: req.picks,
				assets: req.assets,
				vultures: req.open_vultures,
				isTeamOwner: req.user != null && req.user.team == req.team.team
			} );
		});
	});

	app.get("/team/:id/:year", TEAM.getInfo, function (req, res) {
		TEAM.getPlayers(req.params.year, req, res, function() {
			req.players = TEAM.sortByPosition(req.players);
			res.render("historicalTeam", { 
				year: req.params.year, 
				players: req.players, 
				team: req.team, 
				isTeamOwner: req.user != null && req.user.team == req.team.team
			} );
		});
	});
}
