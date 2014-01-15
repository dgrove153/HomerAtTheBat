var CASH = require("../models/cash");
var FREEAGENTAUCTION = require("../models/freeAgentAuction");

module.exports = function(app, passport){

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