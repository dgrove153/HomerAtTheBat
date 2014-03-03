var ASYNC = require('async');
var CASH = require("../../models/cash");
var MAILER = require("../../util/mailer");
var MLDP = require("../../models/minorLeagueDraftPick");
var TEAM = require("../../models/team");
var TRADE = require("../../models/trade");

var acceptTrade = function(tradeId, callback) {
	TRADE.findOne({ _id : tradeId }, function(err, trade) {
		if(trade.status === 'PROPOSED') {
			var success = true;
			ASYNC.forEachSeries(trade.items, function(item, cb) {
				if(item.itemType === 'PICK') {
					MLDP.tradePick(item.year, item.round, item.originalTeam, item.to, item.swap, function(_success) {
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
					sendTradeAcceptanceEmail(trade);
					trade.status = 'ACCEPTED';
					trade.save(function() {
						callback("Trade accepted!");
					});
				} else {
					trade.status = 'ERROR';
					trade.save(function() {
						callback("Something went wrong");
					});
				}
			});
		} else {
			callback("Couldn't even find the trade");
		}
	});
}

var sendTradeAcceptanceEmail = function(trade) {
	TEAM.find({ teamId : { $in : [ trade.proposedBy , trade.proposedTo ] } }, function(err, teams) {
		var proposedBy;
		var proposedTo;
		teams.forEach(function(t) {
			if(t.teamId == trade.proposedBy) {
				proposedBy = t;
			}
			if(t.teamId == trade.proposedTo) {
				proposedTo = t;
			}
		});

		var proposedByItems = "<p><b>" + proposedBy.fullName + "</b> Receives:</p><ul>";
		var proposedToItems = "<p><b>" + proposedTo.fullName + "</b> Receives:</p><ul>";
		trade.items.forEach(function(i) {
			if(i.to == trade.proposedBy) {
				proposedByItems += "<li>" + i.itemText + "</li>";
			}
			if(i.to == trade.proposedTo) {
				proposedToItems += "<li>" + i.itemText + "</lli>";
			}
		});
		proposedByItems += "</ul>";
		proposedToItems += "</ul>";

		MAILER.sendMail({ 
			from: 'Homer Batsman',
			to: [ 'ALL' ],
			subject: "Trade Accepted",
			html: "<h3>A trade has been accepted!</h3>" +
				"<p><b>" + proposedBy.fullName + "</b> and <b>" + proposedTo.fullName + "</b> have agreed to a trade:" +
				proposedByItems + proposedToItems +
				"If you are involved in this trade please confirm that the funds/picks were " + 
				"appropriately transfered. If you have an issue with this trade, please e-mail the commissioner."
		}); 
	});
}

var declineTrade = function(tradeId, callback) {
	TRADE.findOne({ _id : tradeId }, function(err, trade) {
		trade.status = "DECLINED";
		trade.save(function() {
			callback("Trade declined");
		});
	});
}

var cancelTrade = function(tradeId, callback) {
	TRADE.findOne({ _id : tradeId }, function(err, trade) {
		trade.status = "CANCELLED";
		trade.save(function() {
			callback("Trade cancelled");
		});
	});
}	

module.exports = {
	acceptTrade : acceptTrade,
	declineTrade : declineTrade,
	cancelTrade : cancelTrade
}