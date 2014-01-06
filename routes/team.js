var TEAM = require('../models/team');
var CONFIG = require('../config/config');
var VULTURE = require('../application/vulture');
var TRADE = require('../application/trade');
var CASH = require('../models/cash');
var MLDP = require('../models/minorLeagueDraftPick');

module.exports = function(app, passport){
	app.get("/team", function(req, res) {
		if(req.user != undefined) {
			res.redirect('/team/' + req.user.team);
		} else {
			res.redirect('/');
		}
	});

	app.get("/team/:id", 
		TEAM.getInfo, 
		MLDP.findForTeam, 
		VULTURE.getVulturesForTeam, 
		TRADE.getOpenTrades, 
		CASH.getFinancesForTeam,
		function (req, res) {
			TEAM.getPlayers(CONFIG.year, req.params.id, function(players) {
				req.players = TEAM.sortByPosition(players);
				res.render("team", { 
					year: CONFIG.year, 
					isTradingOn: CONFIG.isTradingOn,
					players: req.players, 
					team: req.team, 
					isTeamOwner: req.user != null && req.user.team == req.team.team,
					vulture_message: req.flash('vulture_message')
				} );
		});
	});

	app.get("/team/:id/:year", TEAM.getInfo, function (req, res) {
		TEAM.getPlayers(req.params.year, req.params.id, function(players) {
			req.players = TEAM.sortByPosition(players);
			res.render("historicalTeam", { 
				year: req.params.year, 
				players: req.players, 
				team: req.team, 
				isTeamOwner: req.user != null && req.user.team == req.team.team
			} );
		});
	});
}
