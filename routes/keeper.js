var TEAM = require('../models/team');
var KEEPER = require("../application/keeper");
var CONFIG = require("../config/config");
var CASH = require("../models/cash");

module.exports = function(app, passport){

	////////////////
	//SELECT PLAYERS
	////////////////

	app.get("/gm/keepers/:id", CASH.getDraftMoney, function (req, res) {
		var year = CONFIG.year; 
		TEAM.getPlayers(year, req.params.id, false, function(players) {
			var team = req.teamHash[req.params.id];
			players = KEEPER.setKeeperProperties(players);
			req.players = TEAM.sortByPosition(players);
			res.render("keepers", { 
				title: "Select Keepers",
				message: req.flash('message'),
				isOffseason: CONFIG.isOffseason,
				year: year,
				players: req.players, 
				team: team, 
				isTeamOwner: req.user != null && req.user.team == team.team
			} );
		});
	});

	//////////////
	//SAVE CHOICES
	//////////////

	app.post("/gm/keeper", function(req, res) {
		KEEPER.updateSelections(req.body, function(message) {
			res.send('worked');
		});
	});
}