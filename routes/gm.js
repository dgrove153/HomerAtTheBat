var TEAM = require('../models/team');
var PLAYER = require('../models/player');
var VULTURE = require("../application/vulture");
var KEEPER = require("../application/keeper");
var TRADE = require("../application/trade");

module.exports = function(app, passport){

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
					user: req.user, 
				});
			});
		}
	});

	app.post("/gm/vulture/:pid", function(req, res) {
		VULTURE.submitVulture(req.params.pid, req.body.removingPlayer, req.user, function(message) {
			res.send(message);
		});
	});

	app.post("/gm/keeper", function(req, res) {
		KEEPER.updateSelections(req.body);
		res.send("worked");
	});

	app.get("/gm/trade/:id", TRADE.getTradeObjects, function(req, res) {
		res.render("trade", { 
			from_team: req.from_team,
			to_team: req.to_team,
			from_players: req.from_players, 
			to_players: req.to_players,
			from_assets: req.from_assets,
			to_assets: req.to_assets
		});
	});

	app.post("/gm/trade", function(req, res) {
		TRADE.proposeTrade(req.body.from, req.body.to);
		res.send('got em');
	})
}
