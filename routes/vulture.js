var TEAM = require('../models/team');
var VULTUREROUTE = require("../application/vulture/route");
var VULTURECREATE = require("../application/vulture/create");
var VULTUREHELPERS = require("../application/vulture/helpers");
var CONFIG = require("../config/config").config();
var APP = require("../application/app");

module.exports = function(app, passport, io){

	//////////////
	//VULTURE PAGE
	//////////////

	app.get("/gm/vulture", APP.isUserLoggedIn, VULTUREROUTE.getOpenVultures, VULTUREROUTE.getVulturablePlayers, function(req,res) {
		var isVultureOn = CONFIG.isVultureOn;
		res.render('vulture', {
			title: "Vulture",
			isVultureOn: isVultureOn,
			vulture_message: req.flash('vulture_message')
		});
	});

	/////
	//FIX
	/////

	app.post("/gm/vulture/fix/:pid", function(req, res) {
		VULTUREHELPERS.updateStatusAndCheckVulture(req.params.pid, function(isFixed, status_code, fantasy_status_code) {
			var message;
			if(isFixed) {
				message = "Statuses match, vulture removed!";
			} else {
				message = "Sorry, the player is still vulturable. MLB Status: " + status_code + " and Fantasy Status: " + 
					fantasy_status_code + " do not match.";
			}
			io.sockets.in(req.user.team).emit('message', { 
				player: req.params.pid, 
				message: message
			});
			res.send('ok');
		}, io, req.user);
	});

	///////////////////////
	//VULTURE PLAYER SELECT
	///////////////////////

	app.get("/gm/vulture/:pid", VULTUREROUTE.getPlayerToVulture, function(req, res) {
		TEAM.getPlayers(CONFIG.year, req.user.team, false, function(players) {
			players = TEAM.sortByPosition(players);
			res.render('vulturePlayer', { 
				vulture_message: req.flash('vulture_message'),
				players: players,
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