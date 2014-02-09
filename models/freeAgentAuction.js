var mongoose = require("mongoose");
var CASH = require("./cash");
var CONFIG = require("../config/config").config();
var PLAYER = require("./player");
var SCHEDULE = require('node-schedule');
var MAILER = require('../util/mailer');
var NOTIFICATION = require('../models/notification');
var ASYNC = require("async");
var MOMENT = require('moment');

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
		to: ['GOB'],
		subject: "Free Agent Auction Request",
		text: message
	}); 
};

freeAgentAuctionSchema.statics.createNew = function(player_id, teams, callback) {
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
						to: ['GOB'],
						subject: "New Free Agent Auction!",
						html: "<h3>New Free Agent Auction</h3><h1>" + faa.player_name + "</h1><p>The deadline for the auction is " + 
							MOMENT(faa.deadline).format('MMMM Do YYYY, h:mm a [EST]') + 
							". To bid, <a href='http://homeratthebat.herokuapp.com/gm/faa'>click here</a>."
					}); 

					var message = "New Free Agent Auctin: " + faa.player_name;
					NOTIFICATION.createNew('FREE_AGENT_AUCTION_STARTED', faa.player_name, 'ALL', message, function() {
							callback(message);
					}, teams);

					SCHEDULE.scheduleJob(faa.deadline, function() {
						FreeAgentAuction.findOne({player_name:faa.player_name}, function(err, auction) {
							if(auction.active) {
								endAuction(auction._id, function(data, message) {
									console.log("AUCTION IS OVER: " + message);
									
									MAILER.sendMail({ 
										from: 'Homer Batsman',
										to: ['GOB'],
										subject: "Free Agent Auction Has Ended",
										html: "<h3>A Free Agent Auction Has Ended</h3><h1>" + data.player_name + "</h1>" +
										"<p>The deadline for this auction has passed. " + message
									}); 
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

		var winningBidCount = 0;

		var winningBid = { team: undefined, amount: -1 };
		for(var i = 0; i < data.bids.length; i++) {
			if(data.bids[i].amount > winningBid.amount) {
				winningBid = data.bids[i];
				winningBidCount = 1;
			} else if(data.bids[i].amount == winningBid.amount) {
				winningBidCount++;
			}
		}

		if(winningBid.team == undefined) {
			callback(data, "There were no bids for this player, they are now a free agent.");
			return;
		}

		if(winningBidCount > 1) {
			callback(data, "There were two or more bids of equal value. Ari will handle this offline.");
			return;
		}

		CASH.findOne({team: winningBid.team, year: CONFIG.year, type:'FA'}, function(err, cash) {
			if(err || !cash) {
				callback(data, "The team with the winning bid did not have the cash they bid.");
				return;
			}
			cash.value -= winningBid.amount;
			cash.save();
		});

		PLAYER.findOne({player_id : data.player_id}, function(err, player) {
			PLAYER.updatePlayerTeam(player, winningBid.team, CONFIG.year, function() {
				callback(data, winningBid.team + " won with a winning bid of " + winningBid.amount +
					". They may now add the player on ESPN");
			});
		});
	});
}

freeAgentAuctionSchema.statics.endAuction = endAuction;

var FreeAgentAuction = mongoose.model('freeAgentAuction', freeAgentAuctionSchema);
module.exports = FreeAgentAuction;