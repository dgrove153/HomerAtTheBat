var ASYNC = require('async');
var CASH = require('../../models/cash');
var CONFIG = require("../../config/config").config();
var MLDP = require("../../models/minorLeagueDraftPick");
var MAILER = require("../../util/mailer");
var MOMENT = require("moment");
var NOTIFICATION = require('../../models/notification');
var PLAYER = require("../../models/player");
var TEAM = require("../../models/team");
var TRADE = require("../../models/trade");
var SCHEDULE = require("node-schedule");

var validateObject = function(tradeObj, tradeValid, message, callback) {
	if(tradeValid) {
		if(tradeObj.itemType === 'PICK') {
			MLDP.findOne({ original_team : tradeObj.originalTeam, team : tradeObj.from, year : tradeObj.year, round : tradeObj.round }, function(err, pick) {
				if(!pick) {
					tradeValid = false;
					TEAM.findOne({ teamId : tradeObj.from }, function(err, team) {
						message = team.fullName + " does not own a pick in round " + tradeObj.round + " of the " +
							tradeObj.year + " minor league draft";
						callback(tradeValid, message);
					});
				} else if(pick.swap && pick.swap.swappable && tradeObj.swap && tradeObj.swap.swappable) {
					tradeValid = false;
					TEAM.findOne({ teamId : tradeObj.from }, function(err, team) {
						message = team.fullName + " has already given up the rights to swap picks in round " + tradeObj.round + 
							" of the " + tradeObj.year + " minor league draft";
						callback(tradeValid, message);
					});
				} else {
					callback(tradeValid, message);
				}
			});
		} else if(tradeObj.itemType === 'PLAYER') {
			PLAYER.findOne({ _id : tradeObj.player_id }, function(err, player) {
				if(!player) {
					tradeValid = false;
					message = tradeObj.player_name + " could not be found";
					callback(tradeValid, message);
				} else {
					var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
					if(player.history[historyIndex].fantasy_team != tradeObj.from) {
						tradeValid = false;
						message = player.name_display_first_last + " is not on the team trying to trade him.";
					} else if(player.history[historyIndex].fantasy_position != 'Minors') {
						tradeValid = false;
						message = player.name_display_first_last + " is not on a minor league roster anymore, trade for them via ESPN";
					}
					callback(tradeValid, message);
				}
			});
		} else {
			CASH.findOne({ type : tradeObj.cashType, year : tradeObj.year, team : tradeObj.from }, function(err, cash) {
				if(cash.value - tradeObj.amount < 0) {
					tradeValid = false;
					TEAM.findOne({ teamId : tradeObj.from }, function(err, team) {
						message = team.fullName + " does not have enough " + cash.type + " cash in " + cash.year +
							" to complete this trade.";
						callback(tradeValid, message);
					});
				} else {
					callback(tradeValid, message);
				}
			});
		}
	} else {
		callback(tradeValid, message);
	}
}

var createTrade = function(trade, callback) {
	TEAM.find({}, function(err, teams) {
		var newTrade = new TRADE(trade);
		newTrade.status = "PROPOSED";

		newTrade.items.forEach(function(c) {
			if(c.itemType == 'CASH') {
				c.itemText = "$" + c.amount + " of " + c.year + " " + c.cashType + " cash";
			} else if(c.itemType == 'PLAYER') {
				c.itemText = c.player_name;
			} else {
				var team;
				teams.forEach(function(t) {
					if(t.teamId == c.originalTeam) {
						team = t;
					}
				});
				c.itemText = team.team + "'s round " + c.round + " pick in " + c.year + " Minor League Draft"
			}
		});

		var timeParams = { timeframe : CONFIG.tradeTimeframe, units: CONFIG.tradeDuration	};
		newTrade.deadline = MOMENT().add(timeParams.timeframe, timeParams.units).format();
		newTrade.save(function(err, trade) {
			var deadlineDisplayTime = MOMENT(newTrade.deadline).format('MMMM Do YYYY, h:mm a [EST]');
			var message = "Your trade has been proposed. The deadline for the recipient to accept the trade is " +
				deadlineDisplayTime;
			createNotificationAndEmail(trade, deadlineDisplayTime);
			scheduleExpiration(trade);
			callback(message);
		});		
	});

}

var scheduleExpiration = function(trade) {
	var now = MOMENT().add('minutes', 5);
	var deadline = MOMENT(trade.deadline);
	if(now > deadline) {
		trade.deadline = now;
	}
	console.log("scheduling job for " + trade.deadline);
	SCHEDULE.scheduleJob(trade.deadline, function() {
		TRADE.findOne( { _id : trade._id }, function(err, trade) {
			if(trade.status === 'PROPOSED') {
				trade.status = 'EXPIRED';
				trade.save();
			}
		});
	});
}

var createNotificationAndEmail = function(trade, deadlineDisplayTime) {
	var messageForRecipient = "A trade has been proposed to you. Click the 'Trade' tab to check it out";
	NOTIFICATION.createNew('TRADE_PROPOSED', undefined, trade.proposedTo, messageForRecipient);
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
			to: [ trade.proposedTo, trade.proposedBy ],
			subject: "New Trade Proposal",
			html: "<h3>You have a new trade proposal!</h3>" +
				"<p><b>" + proposedBy.fullName + "</b> has sent you a trade proposal:</p>" +
				proposedByItems + proposedToItems +
				"The deadline for the trade is " + 
				deadlineDisplayTime + ". To review the trade, <a href='http://homeratthebat.herokuapp.com/trade'>click here</a>."
		}); 
	});
}

var submitTrade = function(trade, responseFunction) {
	var fromReceives = trade.fromReceives;
	var toReceives = trade.toReceives;

	var tradeValid = true;
	var message;

	ASYNC.forEachSeries(trade.items, function(tradeObj, cb) {
		validateObject(tradeObj, tradeValid, message, function(_tradeValid, _message) {
			tradeValid = _tradeValid;
			message = _message;
			cb();
		});
	}, function() {
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
	scheduleExpiration : scheduleExpiration,
	submitTrade : submitTrade
}