var MLD = require("../application/minorLeagueDraft");
var TEAM = require("../models/team");
var MLB = require('../external/mlb');
var CONFIG = require("../config/config");

module.exports = function(app, passport){
	
	///////
	//DRAFT
	///////
	app.get("/gm/draft", MLD.getDraft, function(req, res) {
		TEAM.getPlayers(CONFIG.year, req.user.team, true, function(minorLeaguers) {
			var draft_message = req.flash('draft_message');
			res.render("draft", {
				title: 'Minor League Draft',
				draft_message: draft_message,
				minorLeaguers: minorLeaguers, 
				picks: req.picks,
				current_pick: req.current_pick
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
		MLD.submitPick(req.body, function(message) {
			req.flash('draft_message', message);
			res.redirect("/gm/draft");
		});
	});

	app.get("/gm/draft/order", function(req, res) {
		MLD.orderDraft();
		res.send('ordered');
	});

}