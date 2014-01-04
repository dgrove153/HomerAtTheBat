var mongoose = require("mongoose");
var CASH = require("./cash");
var CONFIG = require("../config/config");
var PLAYER = require("./player");

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
			faa.active = true;
			faa.save();
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

freeAgentAuctionSchema.statics.endAuction = function(_id, callback) {
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
	});
}

var FreeAgentAuction = mongoose.model('freeAgentAuction', freeAgentAuctionSchema);
module.exports = FreeAgentAuction;