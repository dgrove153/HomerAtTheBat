var CASH = require("../models/cash");
var FREEAGENTAUCTION = require("../models/freeAgentAuction");
var CONFIG = require("../config/config");
var APP = require("../application/app");

module.exports = function(app, passport){

	////////////////////
	//FREE AGENT AUCTION
	////////////////////

	app.get("/gm/faa", APP.isUserLoggedIn, CASH.getFreeAgentAuctionCash, FREEAGENTAUCTION.getActiveAuctions, function(req, res) {
		res.render("freeAgentAuction", {
			isOffseason: CONFIG.isOffseason,
			title: "Free Agent Auction",
			message: req.flash('message')
		});
	});

	app.post("/gm/faa", function(req, res) {
		FREEAGENTAUCTION.createNew(req.body.id, res.locals.teams, function(message) { 
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

	app.post("/gm/faa/request", function(req, res) {
		FREEAGENTAUCTION.requestNew(req.body.playerName, req.body.requestingTeam, function(message) {
			req.flash('message', message);
			res.redirect("/gm/faa");
		});
	});
}