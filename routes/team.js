var Team = require('../models/team');
var Asset = require('../models/asset');
var Config = require('../config/config');
var Vulture = require("../application/vulture");

module.exports = function(app, passport){
	app.get("/team", function(req, res) {
		if(req.user != undefined) {
			res.redirect('/team/' + req.user.team);
		} else {
			res.redirect('/');
		}
	});

	app.get("/team/:id", Team.getInfo, Team.getPlayers, Asset.findForTeam, Vulture.getVulturesForTeam, function (req, res) {
		var go = function(req, res, teams) { 
			res.render("team", { 
				year: Config.year, 
				players: req.players, 
				team: req.team, 
				assets : req.assets, 
				teamList: teams,
				vultures: req.open_vultures,
				isTeamOwner: req.user != null && req.user.team == req.team.team
			} );
		};

		Team.find({}, function(err, teams) {
			go(req, res, teams);
		});
		
	});
}
