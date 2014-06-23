var CASH = require('../models/cash');
var CONFIGFULL = require('../config/config');
var CONFIG = CONFIGFULL.config();
var KEEPER = require("../application/keeper");
var MLDP = require('../models/minorLeagueDraftPick');
var NUMERAL = require('numeral');
var TEAM = require('../models/team');
var USER = require('../models/user');
var VULTUREROUTE = require('../application/vulture/route');
var TEAMSORT = require('../application/sort');
var TEAMSEARCH = require("../application/team/search");

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
		VULTUREROUTE.getVulturesForTeam, 
		CASH.getFinancesForTeam,
		USER.findOwners,
		function (req, res) {
			if(req.params.id == 'undefined') {
				res.redirect("/");
				return;
			}
			TEAMSEARCH.getPlayers(CONFIG.year, req.params.id, false, function(players) {
				var team = req.teamHash[req.params.id];
				players = TEAM.setVultureProperties(players);
				if(CONFIG.isKeeperPeriod) {
					players = KEEPER.setKeeperProperties(players);
				}
				req.players = TEAMSORT.sortToFantasyPositions(players);
				var config = CONFIGFULL.clone();
				config.isTeamOwner = req.user != null && req.user.team == team.teamId;
				res.render("team", { 
					title: team.fullName,
					config: config,
					players: req.players, 
					team: team, 
					message: req.flash('message'),
					numeral : NUMERAL
				} );
		});
	});

	app.get("/team/:id/:year", function (req, res) {
		TEAMSEARCH.getPlayers(req.params.year, req.params.id, false, function(players) {
			var team = req.teamHash[req.params.id];
			req.players = TEAMSORT.sortToFantasyPositions(players);
			var config = CONFIGFULL.clone();
			config.isTeamOwner = req.user != null && req.user.team == team.team;
			res.render("historicalTeam", { 
				title: team.fullName + " - " + req.params.year,
				year: req.params.year, 
				players: req.players, 
				team: team, 
				config: config
			} );
		});
	});
}
