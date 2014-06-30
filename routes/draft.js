var MLD = require("../application/minorLeagueDraft");
var TEAM = require("../models/team");
var TEAMSEARCH = require("../application/team/search");
var MLB = require('../external/mlb');
var CONFIG = require("../config/config").config();
var APP = require("../application/app");

module.exports = function(app, passport){
	
	///////
	//DRAFT
	///////
	app.get("/gm/draft", APP.isUserLoggedIn, MLD.getDraft, function(req, res) {
		TEAMSEARCH.getPlayers(CONFIG.year, req.user.team, true, function(minorLeaguers) {
			var message = req.flash('message');
			res.render("draft", {
				title: 'Minor League Draft',
				message: message,
				minorLeaguers: minorLeaguers, 
				picks: req.picks,
				current_pick: req.current_pick,
				last_pick : req.last_pick
			});
		});

	});

	app.post("/gm/draft/preview", function(req, res) {
		MLB.getMLBProperties(req.body.player_id, function(json) {
			if(json === undefined) {
				res.send("Sorry, no player with that id was found");
			} else {
				res.send("You are about to draft " + json.name_display_first_last + ". Proceed?");
			}
		});
	});

	app.post("/gm/draft/pick", MLD.checkMinorLeagueRosterSize, function(req, res) {
		MLD.submitPick(req.body, function(message, isSuccess) {
			req.flash('message', { isSuccess: isSuccess, message : message });
			res.redirect("/gm/draft");
		});
	});

	app.get("/draft/order", function(req, res) {
		MLD.orderDraft();
		res.send('ordered');
	});

	app.get("/gm/draft/help", function(req, res) {
		res.render("draftHelp");
	});

	app.post("/gm/draft/offline", function(req, res) {
		console.log(req.body);
		var playerId = req.body.playerId;
		var playerName = req.body.playerName;
		var team = req.body.team;
		MLD.submitOfflinePick(playerId, playerName, team, function(player) {
			req.flash('message', { isSuccess: true, message : player.name_display_first_last + " is now on " + team });
			res.redirect("/admin");
		});
	});

}