var mongoose = require("mongoose");
var CASH = require("./cash");
var CONFIG = require("../config/config");
var PLAYER = require("./player");
var SCHEDULE = require('node-schedule');
var MAILER = require('../util/mailer');
var NOTIFICATION = require('../models/notification');
var ASYNC = require("async");

var freeAgentAuctionSchema = new mongoose.Schema({
	player_name: String,
	player_id: Number,
	active: Boolean,
	deadline: Date, 
	bids: [{
		team: String,
		amount: Number
	}]
}, { collection: 'freeAgentAuction'});

/////////////////
//ROUTE FUNCTIONS
/////////////////

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

////////
//CREATE
////////

freeAgentAuctionSchema.statics.requestNew = function(name, requestingTeam, callback) {
	var message = requestingTeam + " is requesting to start a free agent auction for " + name;
	NOTIFICATION.createNew('FREE_AGENT_AUCTION_REQUEST', name, 'GOB', message, function() {
			callback("The Commisioner has been notified of your request");
	});
	MAILER.sendMail({ 
		from: 'Homer Batsman',
		to: 'GOB',
		subject: "Free Agent Auction Request",
		text: message
	}); 
};

freeAgentAuctionSchema.statics.createNew = function(player_id, callback) {
	FreeAgentAuction.findOne({player_id : player_id}, function(err, data) {
		if(data && data.active) {
			callback("There is already an auction for this player");
		} else {
			var player;
			ASYNC.series([
				function(cb) {
					PLAYER.findOne({player_id : player_id}, function(err, dbPlayer) {
						if(!dbPlayer) {
							var history = [{
								year : CONFIG.year,
								salary : 3,
								contract_year : 0,
								minor_leaguer : false
							}];
							PLAYER.createPlayerWithMLBId(player_id, null, null, history, function(newPlayer) {
								player = newPlayer;
								cb();
							});
						} else {
							player = dbPlayer;
							cb();
						}
					});
				}, function(cb) {
					var faa = new FreeAgentAuction();
					faa.player_id = player.player_id;
					faa.player_name = player.name_display_first_last;
					faa.deadline = new Date(new Date().getTime() + 1*60000);
					faa.active = true;
					faa.save();

					MAILER.sendMail({ 
						from: 'Homer Batsman',
						to: 'GOB',
						subject: "deadline",
						text: "the deadline for the auction is " + faa.deadline
					}); 

					SCHEDULE.scheduleJob(faa.deadline, function() {
						FreeAgentAuction.findOne({player_name:faa.player_name}, function(err, auction) {
							if(auction.active) {
								endAuction(auction._id, function(message) {
									console.log("AUCTION IS OVER: " + message);
								});
							}
						});
					});

					callback("Free Agent Auction for " + player + " created");	
					cb();
				}
			]);
		}
	});
};

/////
//BID
/////

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

/////////////
//END AUCTION
/////////////

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
			return;
		}

		CASH.findOne({team: winningBid.team, year: CONFIG.year, type:'FA'}, function(err, cash) {
			if(err || !cash) {
				callback("Couldn't find cash for the winning team");
				return;
			}
			cash.value -= winningBid.amount;
			cash.save();
		});

		PLAYER.findOne({player_id : data.player_id}, function(err, player) {
			PLAYER.updatePlayerTeam(player, winningBid.team, CONFIG.year, function() {
				callback(winningBid.team + " won " + data.player_name + " with a winning bid of " + winningBid.amount);
			});
		});
	});
}

freeAgentAuctionSchema.statics.endAuction = endAuction;

var FreeAgentAuction = mongoose.model('freeAgentAuction', freeAgentAuctionSchema);
module.exports = FreeAgentAuction;