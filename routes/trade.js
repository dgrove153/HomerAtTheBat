var APP = require("../application/app");
var CONFIG = require("../config/config").config();
var TRADEROUTE = require("../application/trade/route");
var TRADECREATE = require("../application/trade/create");



module.exports = function(app, passport){

	app.get("/trade/:team", APP.isUserLoggedIn, TRADEROUTE.getTradeObjects, function(req, res) {
		var tradePayload = req.flash('tradePayload');
		if(req.flash('trad'))
		res.render("trade", {
			message : req.flash('message'),
			tradePayload : tradePayload,
			year: CONFIG.year,
			config : CONFIG
		});
	});

	app.post("/trade/submit", function(req, res) {
		var trade = JSON.parse(req.body.trade);
		TRADECREATE.submitTrade(trade, function(success, message) {
			req.flash('message', message);
			if(success) {
				res.redirect('/team/' + trade.fromTeam);
			} else {
				req.flash('tradePayload', trade);
				res.redirect("/trade/" + trade.toTeam);
			}
		});
	})

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