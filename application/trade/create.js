var ASYNC = require('async');
var CASH = require('../../models/cash');
var MLDP = require("../../models/minorLeagueDraftPick");
var TEAM = require("../../models/team");
var TRADE = require("../../models/trade");
var MOMENT = require("moment");

var validateObject = function(tradeObj, teamId, tradeValid, message, callback) {
	if(tradeObj.itemType === 'PICK') {
		MLDP.findOne({ team : teamId, year : tradeObj.year, round : tradeObj.round }, function(err, pick) {
			if(!pick) {
				tradeValid = false;
				TEAM.findOne({ teamId : teamId }, function(err, team) {
					message = team.fullName + " does not own a pick in round " + tradeObj.round + " of the " +
						tradeObj.year + " minor league draft";
					callback(tradeValid, message);
				});
			} else if(pick.swap && tradeObj.swap) {
				tradeValid = false;
				TEAM.findOne({ teamId : teamId }, function(err, team) {
					message = team.fullName + " has already given up the rights to swap picks in round " + tradeObj.round + 
						" of the " + tradeObj.year + " minor league draft";
					callback(tradeValid, message);
				});
			} else {
				callback(tradeValid, message);
			}
		});
	} else {
		CASH.findOne({ type : tradeObj.itemType, year : tradeObj.year, team : teamId }, function(err, cash) {
			if(cash.value - tradeObj.amount < 0) {
				tradeValid = false;
				TEAM.findOne({ teamId : teamId }, function(err, team) {
					message = team.fullName + " does not have enough " + cash.type + " cash in " + cash.year +
						" to complete this trade.";
					callback(tradeValid, message);
				});
			} else {
				callback(tradeValid, message);
			}
		});
	}
}

var createTrade = function(trade, callback) {
	var newTrade = new TRADE(trade);
	newTrade.status = "PROPOSED";

	var timeParams = { timeframe : 'days'	, units: 3	};
	newTrade.deadline = MOMENT().add(timeParams.timeframe, timeParams.units).format();
	newTrade.save(function(err, trade) {
		console.log(trade);
		var deadlineDisplayTime = MOMENT(newTrade.deadline).format('MMMM Do YYYY, h:mm a [EST]');
		var message = "Your trade has been proposed. The deadline for the recipient to accept the trade is " +
			deadlineDisplayTime;
		callback(message);
	});
}

var submitTrade = function(trade, responseFunction) {
	var fromReceives = trade.fromReceives;
	var toReceives = trade.toReceives;

	var tradeValid = true;
	var message;

	ASYNC.series(
		[
			function(done) {
				ASYNC.forEachSeries(fromReceives, function(tradeObj, cb) {
					validateObject(tradeObj, trade.toTeam, tradeValid, message, function(_tradeValid, _message) {
						tradeValid = _tradeValid;
						message = _message;
						cb();
					});
				}, function() {
					done();
				});
			},
			function(done) {
				ASYNC.forEachSeries(toReceives, function(tradeObj, cb) {
					validateObject(tradeObj, trade.fromTeam, tradeValid, message, function(_tradeValid, _message) {
						tradeValid = _tradeValid;
						message = _message;
						cb();
					});
				}, function() {
					done();
				});	
			}	
		]
	, function() {
		if(tradeValid) {
			createTrade(trade, function(message) {
				responseFunction(tradeValid, message);
			});
		} else {
			responseFunction(tradeValid, message);
		}
	});
}

module.exports = {
	submitTrade : submitTrade
}