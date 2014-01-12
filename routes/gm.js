var TEAM = require('../models/team');
var PLAYER = require('../models/player');
var VULTURE = require("../application/vulture");
var KEEPER = require("../application/keeper");
var TRADE = require("../application/trade");
var CONFIG = require("../config/config");
var MLD = require("../application/minorLeagueDraft");
var CASH = require("../models/cash");
var FREEAGENTAUCTION = require("../models/freeAgentAuction");
var APP = require("../application/app");
var MLB = require('../external/mlb');

module.exports = function(app, passport){
	
	

	///////
	//DRAFT
	///////
	app.get("/gm/draft", MLD.getDraft, function(req, res) {
		var draft_message = req.flash('draft_message');
		res.render("draft", {
			draft_message: draft_message,
			picks: req.picks,
			current_pick: req.current_pick
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

	app.post("/gm/draft/pick", function(req, res) {
		MLD.submitPick(req.body, function(message) {
			req.flash('draft_message', message);
			res.redirect("/gm/draft");
		});
	});

	app.get("/gm/draft/order", function(req, res) {
		MLD.orderDraft();
		res.send('ordered');
	})

	////////
	//LOCKUP
	////////

	app.get("/gm/lockup/:pid", function(req, res) {
		PLAYER.lockUpPlayer(req.params.pid, function(message) {
			console.log(message);
			res.redirect("/");
		});	
	});

	////////////////////
	//FREE AGENT AUCTION
	////////////////////

	app.get("/gm/faa", CASH.getFinancesForTeam, FREEAGENTAUCTION.getActiveAuctions, function(req, res) {
		res.render("freeAgentAuction", {
			message: req.flash('message')
		});
	});

	app.post("/gm/faa", function(req, res) {
		FREEAGENTAUCTION.createNew(req.body.name, function(message) { 
			req.flash('info', message);
			res.redirect("/admin");
		});
	});

	app.post("/gm/faa/bid", CASH.hasFundsForBid, function(req, res) {
		FREEAGENTAUCTION.makeBid(req.body._id, req.body.bid, req.user.team, function(message) { 
			req.flash('message', message);
			res.redirect("/gm/faa");
		});
	});

	app.get("/gm/faa/end/:_id", function(req, res) {
		FREEAGENTAUCTION.endAuction(req.params._id, function() { });
		res.redirect("/");
	});
}
