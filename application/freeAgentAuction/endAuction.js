var CASH = require("../../models/cash");
var CONFIG = require("../../config/config").config();
var FREEAGENTAUCTION = require('../../models/freeAgentAuction');
var MAILER = require('../../util/mailer');
var PLAYER = require("../../models/player");
var SCHEDULE = require('node-schedule');
var TEAM = require("../../models/team");

var sendFinishMail = function(auction, message) {
	MAILER.sendMail({ 
		from: 'Homer Batsman',
		to: [ 'ALL' ],
		subject: "Free Agent Auction Has Ended",
		html: "<h3>A Free Agent Auction Has Ended</h3><h1>" + auction.player_name + "</h1>" +
		"<p>The deadline for this auction has passed. " + message
	}); 
}

var endAuction = function(_id, callback) {
	FREEAGENTAUCTION.findOne({_id: _id}, function(err, data) {
		if(!data) {
			callback("No such auction");
		}
		data.active = false;
		data.save();

		var winningBidCount = 0;

		var winningBid = { teamId : undefined, amount: -1 };
		for(var i = 0; i < data.bids.length; i++) {
			if(data.bids[i].amount > winningBid.amount) {
				winningBid = data.bids[i];
				winningBidCount = 1;
			} else if(data.bids[i].amount == winningBid.amount) {
				winningBidCount++;
			}
		}

		if(winningBid.teamId == undefined) {
			callback(data, "There were no bids for this player, they are now a free agent.");
			return;
		} else if(winningBidCount > 1) {
			callback(data, "There were two or more bids of equal value. Ari will handle this offline.");
			return;
		} else {
			CASH.findOne( { team : winningBid.teamId, year : CONFIG.year, type : 'FA' }, function(err, cash) {
				if(err || !cash) {
					callback(data, "There was an error finding the auction cash associated with the winning bid. " + 
						"The issue will be resolved offline.");
				} else {
					cash.value -= winningBid.amount;
					cash.save();

					data.winner = winningBid;
					data.save();

					PLAYER.findOne({player_id : data.player_id}, function(err, player) {
						player.updatePlayerTeam(winningBid.teamId, CONFIG.year, function() {
							TEAM.findOne({ teamId: winningBid.teamId }, function(err, team) {
								callback(data, team.fullName + " won with a winning bid of " + winningBid.amount +
									". They may now add the player on ESPN");
							});
						});
					});
				}
			});
		}
	});
}

var scheduleExpiration = function(player, deadline) {
	console.log('scheduling job for ' + deadline);
	var date = new Date(deadline);
	SCHEDULE.scheduleJob(date, function() {
		console.log('job kicked off');
		FREEAGENTAUCTION.findOne( { player_name : player.name_display_first_last, active : true }, function(err, auction) {
			if(auction.active) {
				endAuction(auction._id, function(auction, message) {
					console.log("AUCTION IS OVER: " + message);
					sendFinishMail(auction, message);
				});
			}
		});
	});
	console.log('job scheduled');
}

module.exports = {
	scheduleExpiration : scheduleExpiration,
	endAuction : endAuction	
}