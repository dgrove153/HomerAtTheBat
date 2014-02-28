var ASYNC = require('async');
var CASH = require("../../models/cash");
var MLDP = require("../../models/minorLeagueDraftPick");
var TRADE = require("../../models/trade");

var acceptTrade = function(tradeId, callback) {
	TRADE.findOne({ _id : tradeId }, function(err, trade) {
		if(trade.status === 'PROPOSED') {
			var success = true;
			ASYNC.forEachSeries(trade.items, function(item, cb) {
				if(item.itemType === 'PICK') {
					MLDP.tradePick(item.year, item.round, item.from, item.to, item.swap, function(_success) {
						success = _success;
						cb();
					});
				} else if(item.itemType === 'CASH') {
					CASH.switchFunds(item.from, item.to, item.amount, item.year, item.cashType, function(_success) {
						success = _success;
						cb();
					});
				} else {
					console.log("unknown item type");
					cb();
				}
			}, function() {
				if(success) {
					callback("Trade accepted!");
				} else {
					callback("Something went wrong");
				}
			});
		} else {
			callback("Couldn't even find the trade");
		}
	});
}	

module.exports = {
	acceptTrade : acceptTrade
}