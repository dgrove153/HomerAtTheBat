var TEAM = require('../models/team');
var VULTURE = require("../application/vulture");
var CONFIG = require("../config/config");

module.exports = function(app, passport){

	/////////
	//VULTURE
	/////////

	app.get("/gm/vulture", VULTURE.getOpenVultures, VULTURE.getVulturablePlayers, function(req,res) {
		res.render('vulture', {});
	});

	app.get("/gm/vulture/fix/:pid", function(req, res) {
		VULTURE.updateStatusAndCheckVulture(req.params.pid, function(isFixed, status_code, fantasy_status_code) {
			if(isFixed) {
				req.flash('vulture_message', "Player status has been updated. You have successfully averted this vulture");
				res.redirect("/team/" + req.user.team);
			} else {
				req.flash('vulture_message', 
					"Sorry, the player is still vulturable. MLB Status: " + status_code + " and Fantasy Status: " + 
					fantasy_status_code + " do not match.");
				res.redirect("/team/" + req.user.team);
			}
		});
	});

	app.get("/gm/vulture/:pid", VULTURE.getPlayerToVulture, function(req, res) {
		TEAM.getPlayers(CONFIG.year, req.user.team, function(players) {
			players = TEAM.sortByPosition(players);
			res.render('vulturePlayer', { 
				vulture_message: req.flash('vulture_message'),
				players: players,
			});
		});
	});

	app.post("/gm/vulture/:pid", function(req, res) {
		if(!req.body.removingPlayer) {
			req.flash('vulture_message', "You must select a player to drop to complete the vulture");
			res.redirect("/gm/vulture/" + req.params.pid);
		} else {
			VULTURE.submitVulture(req.params.pid, req.body.removingPlayer, req.user, function(message, url) {
				req.flash('vulture_message', message);
				res.redirect(url);
			});
		}
	});
}