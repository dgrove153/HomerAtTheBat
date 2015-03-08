var CASH = require('../models/cash');
var CONFIGFULL = require('../config/config');
var CONFIG = CONFIGFULL.config();
var KEEPER = require("../application/keeper");
var TEAM = require('../models/team');
var TEAMSEARCH = require("../application/team/search");
var TEAMSORT = require('../application/sort');

module.exports = function(app, passport){

	////////////////
	//SELECT KEEPERS
	////////////////

	app.get("/keepers/:id", CASH.getDraftMoney, function(req, res) {
		if(req.params.id == 'undefined') {
			res.redirect("/");
			return;
		}
		
		TEAMSEARCH.getPlayers(CONFIG.year, req.params.id, false, function(players) {
			var team = req.teamHash[req.params.id];
			var config = CONFIGFULL.clone();
			players = KEEPER.setKeeperProperties(players);
			players = TEAMSORT.sortToFantasyPositions(players);
			res.render("selectKeepers", {
				title : 'Select Keepers | ' + team.fullName,
				cash : res.locals.cash,
				config: config,
				team : team,
				message: req.flash('message'),
				players : players
			});
		});
	})

	//////////////
	//SAVE CHOICES
	//////////////

	app.post("/gm/keeper", function(req, res) {
		KEEPER.updateSelections(req.body, function(message) {
			res.send('worked');
		});
	});

	app.post("/gm/keeper/minorSwitch", function(req, res) {
		KEEPER.keepMinorLeaguerAsMajorLeaguer(req.user.team, req.body._id, undefined, true, function(message) {
			req.flash('message', message);
			res.redirect('/team/' + req.user.team);
		});
	});

	app.post("/gm/keeper/minorSwitch/undo", function(req, res) {
		KEEPER.keepMinorLeaguerAsMajorLeaguer(req.user.team, req.body._id, req.body.prevSalary, false, function(message) {
			req.flash('message', message);
			res.redirect('/team/' + req.user.team);
		});
	});

	//////////
	//FINALIZE
	//////////

	app.get("/gm/keeper/finalize", function(req, res) {
		KEEPER.finalizeKeeperSelections(function() {
			req.flash('info', "Keepers finalized.");
			res.redirect('/admin');
		});
	});
}