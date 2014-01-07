var mongoose = require("mongoose");
var CASH = require("./cash");
var CONFIG = require("../config/config");
var PLAYER = require("./player");
var SCHEDULE = require('node-schedule');
var MAILER = require('../util/mailer');

var freeAgentAuctionSchema = new mongoose.Schema({
	player_name: String,
	active: Boolean,
	deadline: Date, 
	bids: [{
		team: String,
		amount: Number
	}]
}, { collection: 'freeAgentAuction'});

freeAgentAuctionSchema.statics.getActiveAuctions = function(req, res, next) {
	FreeAgentAuction.find({active:true}, function(err, auctions) {
		res.locals.auctions = auctions;
		next();
	});
};

freeAgentAuctionSchema.statics.getFinishedAuctions = function(req, res, next) {
	FreeAgentAuction.find({active:false}, function(err, auctions) {
		res.locals.auctions = auctions;
		next();
	});
};

freeAgentAuctionSchema.statics.createNew = function(player, callback) {
	FreeAgentAuction.findOne({player_name: player}, function(err, data) {
		if(data && data.active) {
			callback("There is already an auction for this player");
		}
		if(!data) {
			var faa = new FreeAgentAuction();
			faa.player_name = player;
			var deadline = new Date();
			deadline.setDate(deadline.getDate() + 1);
			faa.deadline = deadline;
			faa.deadline = new Date(new Date().getTime() + 3*60000);
			faa.active = true;
			faa.save();

			MAILER.sendMail({ 
				from: 'Homer Batsman',
				to: 'arigolub@gmail.com',
				subject: "deadline",
				text: "the deadline for the auction is " + faa.deadline
			}); 

			var k = SCHEDULE.scheduleJob(faa.deadline, function() {
				FreeAgentAuction.findOne({player_name:faa.player_name}, function(err, auction) {
					if(auction.active) {
						endAuction(auction._id, function(message) {
							console.log("AUCTION IS OVER: " + message);
						});
					}
				});
			});

			callback("Free Agent Auction for " + player + " created");
		}
	});
};

freeAgentAuctionSchema.statics.makeBid = function(_id, bid, team, callback) {
	FreeAgentAuction.findOne({_id: _id}, function(err, data) {
		var curDate = new Date();
		if(!data) {
			callback("No such player");
		}
		if(!data.active) {
			callback("This is not an active auction");
		}
		if(curDate > data.deadline) {
			callback("deadline has passed");
		}
		var existingBid = false;
		for(var i = 0; i < data.bids.length; i++) {
			if(data.bids[i].team == team) {
				existingBid = true;
				data.bids[i].amount = bid;
			}
		}
		if(!existingBid) {
			data.bids.push({team:team, amount:bid});
		}
		data.save();
		callback("Bid successful");
	});
};

var endAuction = function(_id, callback) {
	FreeAgentAuction.findOne({_id: _id}, function(err, data) {
		if(!data) {
			callback("No such auction");
		}
		data.active = false;
		data.save();

		var winningBid = { team: undefined, amount: -1 };
		for(var i = 0; i < data.bids.length; i++) {
			if(data.bids[i].amount > winningBid.amount) {
				winningBid = data.bids[i];
			}
		}
		if(winningBid.team == undefined) {
			callback("There were no bids for this player");
		}

		CASH.findOne({team: winningBid.team, year: CONFIG.year, type:'FA'}, function(err, cash) {
			if(err || !cash) {
				callback("Couldn't find cash for the winning team");
			}
			cash.value -= winningBid.amount;
			cash.save();
		});

		PLAYER.createNewPlayer(data.player_name, winningBid.team, 'A', false);
		callback(winningBid.team + " won " + data.player_name + " with a winning bid of " + winningBid.amount);
	});
}

freeAgentAuctionSchema.statics.endAuction = endAuction;

var FreeAgentAuction = mongoose.model('freeAgentAuction', freeAgentAuctionSchema);
module.exports = FreeAgentAuction;