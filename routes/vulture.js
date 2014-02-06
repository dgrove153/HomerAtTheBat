var TEAM = require('../models/team');
var VULTURE = require("../application/vulture");
var CONFIG = require("../config/config");
var APP = require("../application/app");

module.exports = function(app, passport, io){

	//////
	//VIEW
	//////

	app.get("/gm/vulture", APP.isUserLoggedIn, VULTURE.getOpenVultures, VULTURE.getVulturablePlayers, function(req,res) {
		var config = app.get('envConfig');
		var isVultureOn = config.isVultureOn;
		res.render('vulture', {
			title: "Vulture",
			isVultureOn: isVultureOn
		});
	});

	/////
	//FIX
	/////

	app.post("/gm/vulture/fix/:pid", function(req, res) {
		VULTURE.updateStatusAndCheckVulture(req.params.pid, function(isFixed, status_code, fantasy_status_code) {
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
		}, io, req.user);
	});

	///////////////////////
	//VULTURE PLAYER SELECT
	///////////////////////

	app.get("/gm/vulture/:pid", VULTURE.getPlayerToVulture, function(req, res) {
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
			VULTURE.submitVulture(req.params.pid, req.body.removingPlayer, req.user, function(message, url) {
				req.flash('message', message);
				res.redirect(url);
			});
		}
	});
}