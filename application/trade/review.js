var CASH = require("../../models/cash");
var MLDP = require("../../models/minorLeagueDraftPick");
var TRADE = require("../../models/trade");

var acceptTrade = function(trade) {
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