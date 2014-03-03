var APP = require("../application/app");
var CONFIG = require("../config/config").config();
var NOTIFICATION = require("../models/notification");
var TRADE = require("../models/trade");
var TRADEROUTE = require("../application/trade/route");
var TRADECREATE = require("../application/trade/create");
var TRADEREVIEW = require("../application/trade/review");

module.exports = function(app, passport){

	app.get("/trade", APP.isUserLoggedIn, function(req, res) {
		NOTIFICATION.dismissAllByType(req.user.team, 'TRADE_PROPOSED', function() {
			TRADE.getTrades(req.user.team, function(trades) {
				res.render("trade", {
					tradeNotifications : undefined,
					title : 'Trade',
					message : req.flash('message'),
					trades : trades,
					config : CONFIG,
					tradeModel : TRADE
				});
			})
		});
	});

	app.get("/trade/:team", APP.isUserLoggedIn, TRADEROUTE.getTradeObjects, function(req, res) {
		var tradePayload = req.flash('tradePayload');
		res.render("trade2", {
			title : 'Trade Proposal',
			message : req.flash('message'),
			tradePayload : tradePayload,
			year: CONFIG.year,
			config : CONFIG
		});
	});

	app.post("/trade/accept", function(req, res) {
		var tradeId = req.body.tradeId;
		TRADEREVIEW.acceptTrade(tradeId, function(message) {
			req.flash('message', message);
			res.redirect("/trade");
		});
	});

	app.post("/trade/decline", function(req, res) {
		var tradeId = req.body.tradeId;
		TRADEREVIEW.declineTrade(tradeId, function(message) {
			req.flash('message', message);
			res.redirect("/trade");
		});
	});

	app.post("/trade/cancel", function(req, res) {
		var tradeId = req.body.tradeId;
		TRADEREVIEW.cancelTrade(tradeId, function(message) {
			req.flash('message', message);
			res.redirect("/trade");
		});
	});

	app.post("/trade/submit", function(req, res) {
		var trade = JSON.parse(req.body.trade);
		TRADECREATE.submitTrade(trade, function(success, message) {
			req.flash('message', message);
			if(success) {
				res.redirect('/trade');
			} else {
				req.flash('tradePayload', trade);
				res.redirect("/trade/" + trade.proposedTo);
			}
		});
	});

	
}