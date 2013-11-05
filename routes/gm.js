var TEAM = require('../models/team');
var PLAYER = require('../models/player');
var ASSET = require("../models/asset");
var VULTURE = require("../application/vulture");
var KEEPER = require("../application/keeper");
var TRADE = require("../application/trade");
var CONFIG = require("../config/config");
var MLD = require("../application/minorLeagueDraft");
var CASH = require("../models/cash");

module.exports = function(app, passport){

	/////////
	//VULTURE
	/////////
	app.get("/gm/vulture/:pid", VULTURE.isVultureEligible, function( req, res) {
		if(req.attemptToFix == true) {
			VULTURE.updateStatusAndCheckVulture(req.params.pid, function(message) {
				res.send(message);
			});
		} else {
			PLAYER.find({ fantasy_team : req.user.team, fantasy_status_code: 'A' }, function(err, players) {
				res.render('vulture', { 
					player: req.player, 
					playerList: players,
				});
			});
		}
	});

	app.post("/gm/vulture/:pid", function(req, res) {
		VULTURE.submitVulture(req.params.pid, req.body.removingPlayer, req.user, function(message) {
			res.send(message);
		});
	});

	////////
	//KEEPER
	////////
	app.get("/gm/keepers/:id", TEAM.getInfo, CASH.getDraftMoney, function (req, res) {
		var year = CONFIG.year - 1; 
		TEAM.getPlayers(year, req, res, function() {
			req.players = TEAM.sortByPosition(req.players);
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
			from_assets: req.from_assets,
			to_assets: req.to_assets
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
		res.send('got em');
	});

	app.get("/gm/trade/accept/:tid", function(req, res) {
		TRADE.acceptTrade(req.params.tid);
		res.send('got em');
	});

	///////
	//DRAFT
	///////
	app.get("/gm/draft", MLD.getDraft, function(req, res) {
		res.render("draft", {
			picks: req.picks,
			current_pick: req.current_pick
		});
	});

	app.post("/gm/draft/pick", function(req, res) {
		MLD.submitPick(req.body.pick, function(message) {
			res.send(message);
		});
	});
}
