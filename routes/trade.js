var TRADE = require("../application/trade");
var CONFIG = require("../config/config");

module.exports = function(app, passport){

	app.get("/gm/trade/propose/:team", TRADE.getTradeObjects, function(req, res) {
		res.render("trade_2", {
			from_team: req.from_team,
			to_team: req.to_team,
			from_cash: req.from_cash,
			to_cash: req.to_cash,
			year: CONFIG.year,
			from_picks: req.from_picks,
			to_picks: req.to_picks,
			message: req.flash('info')
		});
	});

	app.get("/gm/trade", function(req, res) {
		res.render("trade_2");
	})

	app.get("/gm/trade/:id", TRADE.viewTrade, function(req, res) {
		res.render("tradeReview", {
			trade: req.trade,
			fromPlayers: req.fromPlayers,
			toPlayers: req.toPlayers
		});
	});

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