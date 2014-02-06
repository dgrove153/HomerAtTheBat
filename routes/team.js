var TEAM = require('../models/team');
var CONFIG = require('../config/config');
var VULTURE = require('../application/vulture');
var TRADE = require('../application/trade');
var CASH = require('../models/cash');
var MLDP = require('../models/minorLeagueDraftPick');
var KEEPER = require("../application/keeper");

module.exports = function(app, passport){
	app.get("/team", function(req, res) {
		if(req.user != undefined) {
			res.redirect('/team/' + req.user.team);
		} else {
			res.redirect('/');
		}
	});

	app.get("/team/:id", 
		MLDP.findForTeam, 
		VULTURE.getVulturesForTeam, 
		TRADE.getOpenTrades, 
		CASH.getFinancesForTeam,
		function (req, res) {
			if(req.params.id == 'undefined') {
				res.redirect("/");
				return;
			}
			TEAM.getPlayers(CONFIG.year, req.params.id, false, function(players) {
				var team = req.teamHash[req.params.id];
				players = TEAM.setVultureProperties(players);
				players = KEEPER.setKeeperProperties(players);
				req.players = TEAM.sortByPosition(players);
				res.render("team", { 
					title: team.fullName,
					year: CONFIG.year, 
					config: CONFIG,
					isKeeperPeriod: CONFIG.isKeeperPeriod,
					isTradingOn: CONFIG.isTradingOn,
					players: req.players, 
					team: team, 
					isTeamOwner: req.user != null && req.user.team == team.team,
					vulture_message: req.flash('vulture_message')
				} );
		});
	});

	app.get("/team/:id/:year", function (req, res) {
		TEAM.getPlayers(req.params.year, req.params.id, false, function(players) {
			var team = req.teamHash[req.params.id];
			req.players = TEAM.sortByPosition(players);
			res.render("historicalTeam", { 
				title: team.fullName + " - " + req.params.year,
				year: req.params.year, 
				players: req.players, 
				team: team, 
				isTeamOwner: req.user != null && req.user.team == team.team
			} );
		});
	});
}
