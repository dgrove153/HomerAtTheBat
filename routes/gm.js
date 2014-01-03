var TEAM = require('../models/team');
var PLAYER = require('../models/player');
var ASSET = require("../models/asset");
var VULTURE = require("../application/vulture");
var KEEPER = require("../application/keeper");
var TRADE = require("../application/trade");
var CONFIG = require("../config/config");
var MLD = require("../application/minorLeagueDraft");
var CASH = require("../models/cash");
var FREEAGENTAUCTION = require("../models/freeAgentAuction");

module.exports = function(app, passport){

	/////////
	//VULTURE
	/////////
	app.get("/gm/vulture/:pid", VULTURE.isVultureEligible, function( req, res) {
		if(req.attemptToFix == true) {
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
		} else {
			TEAM.getPlayers(CONFIG.year-1, req.user.team, function(players) {
				players = TEAM.sortByPosition(players);
				res.render('vulture', { 
					vulture_message: req.flash('vulture_message'),
					player: req.player, 
					players: players,
				});
			});
		}
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

	////////
	//KEEPER
	////////
	app.get("/gm/keepers/:id", TEAM.getInfo, CASH.getDraftMoney, function (req, res) {
		var year = CONFIG.year - 1; 
		TEAM.getPlayers(year, req.params.id, function(players) {
			req.players = TEAM.sortByPosition(players);
			res.render("keepers", { 
				isOffseason: CONFIG.isOffseason,
				year: year,
				players: req.players, 
				team: req.team, 
				isTeamOwner: req.user != null && req.user.team == req.team.team
			} );
		});
	});

	app.post("/gm/keeper", function(req, res) {
		KEEPER.updateSelections(req.body);
		res.send("worked");
	});

	///////
	//TRADE
	///////
	app.get("/gm/trade/team/:id", TRADE.getTradeObjects, function(req, res) {
		var from_players = TEAM.sortByPosition(req.from_players);
		var to_players = TEAM.sortByPosition(req.to_players);
		res.render("trade", { 
			from_team: req.from_team,
			to_team: req.to_team,
			from_players: from_players, 
			to_players: to_players,
			from_cash: req.from_cash,
			to_cash: req.to_cash,
			from_picks: req.from_picks,
			to_picks: req.to_picks
		});
	});

	app.get("/gm/trade/:id", TRADE.viewTrade, function(req, res) {
		res.render("tradeReview", {
			trade: req.trade,
			fromPlayers: req.fromPlayers,
			toPlayers: req.toPlayers
		});
	});

	app.post("/gm/trade", function(req, res) {
		TRADE.proposeTrade(req.body.from, req.body.to);
		res.send('proposed');
	});

	app.get("/gm/trade/accept/:tid", function(req, res) {
		TRADE.acceptTrade(req.params.tid);
		res.send('accepted');
	});

	app.get("/gm/trade/cancel/:tid", function(req, res) {
		TRADE.cancelTrade(req.params.tid);
		res.send('cancelled');
	});

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

	app.get("/gm/faa", function(req, res) {
		FREEAGENTAUCTION.createNew("Ari Golub", function() { });
		res.redirect("/");
	});

	app.post("/gm/faa/bid/:_id", CASH.hasFundsForBid, function(req, res) {
		FREEAGENTAUCTION.makeBid(req.params._id, req.body.bid, function() { });
		res.redirect("/");
	});

	app.get("/gm/faa/end/:_id", function(req, res) {
		FREEAGENTAUCTION.endAuction(req.params._id, function() { });
		res.redirect("/");
	});
}
