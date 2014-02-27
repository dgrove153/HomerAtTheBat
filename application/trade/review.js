var CASH = require("../../models/cash");
var MLDP = require("../../models/minorLeagueDraftPick");
var TRADE = require("../../models/trade");

var acceptTrade = function(tradeId, callback) {
	TRADE.find({ _id : tradeId }, function(err, trade) {
		if(trade.status === 'PROPOSED') {
			var success = true;
			ASYNC.forEachSeries(trade.items, function(item, cb) {
				if(item.itemType === 'PICK') {
					cb();
				} else if(item.itemType === 'CASH') {
					CASH.switchFunds(item.from, item.to, item.amount, item.year, item.cashType, cb);
				} else {
					console.log("unknown item type");
					cb();
				}
			}, function() {
				
			});
		} else {

		}
	});

	trade.fromReceives.forEach(function(from) {
		if(from.itemType === 'PICK') {

		} else {
			CASH.switchFunds(trade.toTeam, trade.fromTeam, from.amount, from.year, from.itemType);
		}
	});	

	trade.toReceives.forEach(function(to) {
		if(to.itemType === 'PICK') {

		} else {
			CASH.switchFunds(trade.fromTeam, trade.toTeam, to.amount, to.year, to.itemType);
		}
	});
}	

module.exports = {
	acceptTrade : acceptTrade
}