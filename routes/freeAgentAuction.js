var CASH = require("../models/cash");
var FREEAGENTAUCTION = require("../models/freeAgentAuction");
var CONFIG = require("../config/config");

module.exports = function(app, passport){

	////////////////////
	//FREE AGENT AUCTION
	////////////////////

	app.get("/gm/faa", CASH.getFinancesForTeam, FREEAGENTAUCTION.getActiveAuctions, function(req, res) {
		res.render("freeAgentAuction", {
			title: "Free Agent Auction",
			year: CONFIG.year,
			message: req.flash('message')
		});
	});

	app.post("/gm/faa", function(req, res) {
		FREEAGENTAUCTION.createNew(req.body.id, function(message) { 
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