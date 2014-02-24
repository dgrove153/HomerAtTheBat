var CONFIG = require("../config/config").config();
var FAA_ROUTE = require("../application/freeAgentAuction/route");
var FAA_CREATE = require("../application/freeAgentAuction/create");
var FAA_END = require("../application/freeAgentAuction/endAuction");
var FAA_BID = require("../application/freeAgentAuction/bid");
var APP = require("../application/app");

module.exports = function(app, passport){

	//////
	//PAGE
	//////

	app.get("/gm/faa", 
		APP.isUserLoggedIn, 
		FAA_ROUTE.getFreeAgentAuctionCash, 
		FAA_ROUTE.getActiveAuctions, 
		function(req, res) {
			res.render("freeAgentAuction", {
				isOffseason: CONFIG.isOffseason,
				title: "Free Agent Auction",
				message: req.flash('message')
			});
		}
	);

	/////////////
	//REQUEST NEW
	/////////////
	app.post("/gm/faa/request", function(req, res) {
		FAA_CREATE.requestNew(req.body.playerName, req.body.requestingTeam, function(message) {
			req.flash('message', message);
			res.redirect("/gm/faa");
		});
	});

	////////
	//CREATE
	////////

	app.post("/gm/faa", function(req, res) {
		FAA_CREATE.createNew(req.body.id, res.locals.teams, function(message) { 
			req.flash('info', message);
			res.redirect("/admin");
		});
	});

	/////
	//BID
	/////

	app.post("/gm/faa/bid", 
		FAA_ROUTE.hasFundsForBid, 
		function(req, res) {
			FAA_BID.makeBid(req.body._id, req.body.bid, req.user.team, function(message) { 
				req.flash('message', message);
				res.redirect("/gm/faa");
			});
		}
	);

	/////////////
	//END AUCTION
	/////////////

	app.get("/gm/faa/end/:_id", function(req, res) {
		FAA_END.endAuction(req.params._id, function() { });
		res.redirect("/");
	});
}