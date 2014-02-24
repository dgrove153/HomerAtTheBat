var TEAM = require("../models/team");
var PLAYER = require("../models/player");
var TRADE = require("../models/trade");
var CONFIG = require("../config/config").config();
var CASH = require("../models/cash");
var MLDP = require("../models/minorLeagueDraftPick");
var ASYNC = require("async");

/////////////////
//TRADE DECISIONS
/////////////////

exports.acceptTrade = function(trade_id) {
	TRADE.findOne({_id: trade_id}, function(err, trade) {
		var from = trade.from;
		var to = trade.to;

		//SWAP PICKS
		for(var i = 0; i < from.picks.length; i++) {
			var pick = from.picks[i];
			if(pick.swap) {
				MLDP.swapRights(pick.year, pick.round, from.team, to.team);
			} else {
				MLDP.trade(pick.year, pick.round, pick.original_team, to.team);
			}
		}

		//SWAP CASH
		if(from.cash != undefined) {
			for(var i = 0; i < from.cash.length; i++) {
				var cash = from.cash[i];
				CASH.switchFunds(cash.from, cash.to, cash.amount, cash.year, cash.type);
			}
		}
		if(to.cash != undefined) {
			for(var i = 0; i < to.cash.length; i++) {
				var cash = to.cash[i];
				CASH.switchFunds(cash.from, cash.to, cash.amount, cash.year, cash.type);
			}
		}

		trade.status="ACCEPTED";
		trade.save();
	});
};

exports.cancelTrade = function(trade_id) {
	console.log(trade_id);
	TRADE.findOne({_id: trade_id}, function(err, trade) {
		console.log(trade);
		trade.status = "CANCELLED";
		trade.save();
	});
}

exports.rejectTrade = function(trade_id) {
	TRADE.findOne({_id: trade_id}, function(err, trade) {
		trade.status = "REJECTED";
		trade.save();
	});
}