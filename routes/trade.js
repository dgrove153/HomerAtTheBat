var TRADE = require("../application/trade");
var CONFIG = require("../config/config");
var APP = require("../application/app");

module.exports = function(app, passport){

	app.get("/gm/trade/:team?", APP.isUserLoggedIn, TRADE.getTradeObjects, function(req, res) {
		res.render("trade3", {
			year: CONFIG.year
		});
	});

	app.get("/gm/trade/objects/:team", function(req, res) {
		TRADE.getTradeObjectsForTeam(req.params.team, function(data) {
			res.redirect("/gm/trade/" + req.params.team);
			//res.send(data);
		});
	})

	app.post("/gm/trade", function(req, res) {
		TRADE.validateTrade(req.body, function(message) {
			if(message) {
				req.flash('info', message);
				res.redirect("/gm/trade/propose/" + req.body.to_team);	
			} else {
				TRADE.proposeTrade(req.body);
				res.send('proposed');	
			}
		});
	});

	app.get("/gm/trade/accept/:tid", function(req, res) {
		TRADE.acceptTrade(req.params.tid);
		res.send('accepted');
	});

	app.get("/gm/trade/cancel/:tid", function(req, res) {
		TRADE.cancelTrade(req.params.tid);
		res.send('cancelled');
	});
}