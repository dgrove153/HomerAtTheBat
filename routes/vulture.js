var APP = require("../application/app");
var CONFIGFULL = require("../config/config");
var CONFIG = CONFIGFULL.config();
var PLAYER = require("../models/player");
var TEAM = require('../models/team');
var VULTURECREATE = require("../application/vulture/create");
var VULTUREEND = require("../application/vulture/endVulture");
var VULTUREROUTE = require("../application/vulture/route");

module.exports = function(app, passport, io){

	//////////////
	//VULTURE PAGE
	//////////////

	app.get("/gm/vulture", APP.isUserLoggedIn, VULTUREROUTE.getOpenVultures, VULTUREROUTE.getVulturablePlayers, function(req,res) {
		var isVultureOn = CONFIG.isVultureOn;
		res.render('vulture', {
			title: "Vulture",
			isVultureOn: isVultureOn,
			message: req.flash('vulture_message')
		});
	});

	/////
	//FIX
	/////

	app.post("/gm/vulture/fix/:pid", function(req, res) {
		VULTUREEND.doVultureFixAttempt(req.params.pid, io, req.user, function() {
			res.send('ok');
		});
	});

	app.post("/gm/vulture/end", function(req, res) {
		var vultureId = req.body.vultureId;
		VULTUREEND.doVultureExpiration(vultureId, io, req.user, function() {
			res.send('ok');
		});
	});

	///////////////////////
	//VULTURE PLAYER SELECT
	///////////////////////

	app.get("/gm/vulture/:pid", VULTUREROUTE.getPlayerToVulture, function(req, res) {
		TEAM.getPlayers(CONFIG.year, req.user.team, false, function(players) {
			var team = req.teamHash[req.user.team];
			players = TEAM.setVultureProperties(players);
			players = TEAM.sortByPosition(players);
			var config = CONFIGFULL.clone();
			res.render('vulturePlayer', { 
				message: req.flash('vulture_message'),
				players: players,
				config : config,
				team : team
			});
		});
	});

	////////////////
	//SUBMIT VULTURE
	////////////////

	app.post("/gm/vulture/:pid", function(req, res) {
		if(!req.body.removingPlayer) {
			req.flash('vulture_message', "You must select a player to drop to complete the vulture");
			res.redirect("/gm/vulture/" + req.params.pid);
		} else {
			VULTURECREATE.submitVulture(req.params.pid, req.body.removingPlayer, req.user, function(message, url) {
				req.flash('vulture_message', message);
				res.redirect(url);
			});
		}
	});
}