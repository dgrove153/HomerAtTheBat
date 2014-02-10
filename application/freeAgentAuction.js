var CONFIG = require('../config/config').config();
var CASH = require('../models/cash');
var FREEAGENTAUCTION = require('../models/freeAgentAuction');
var PLAYER = require("./player");
var SCHEDULE = require('node-schedule');
var MAILER = require('../util/mailer');
var NOTIFICATION = require('../models/notification');
var ASYNC = require("async");
var MOMENT = require('moment');

exports.getFreeAgentAuctionCash = function(req, res, next) {
	var year;
	if(CONFIG.isOffseason) {
		year = CONFIG.nextYear;
	} else {
		year = CONFIG.year;
	}
	CASH.find( { year : year, type : 'FA'}, function(err, cashs) {
		res.locals.cashs = cashs;
		next();
	});
}

exports.hasFundsForBid = function(req, res, next) {
	var year = CONFIG.year;
	CASH.findOne({ team : req.user.teamId, year : year, type:'FA' }, function(err, cash) {
		if(err || !cash) {
			req.flash('info', 'Something went wrong in FAA.hasFundsForBid');
			res.redirect("/");
		}
		else if(cash.value < req.body.bid) {
			req.flash('info', 'You do not have enough funds to make that bid');
			res.redirect("/");			
		} else {
			next();
		}
	});
}

exports.getActiveAuctions = function(req, res, next) {
	FREEAGENTAUCTION.find( { active : true }, function(err, auctions) {
		res.locals.auctions = auctions;
		next();
	});
};

exports.getFinishedAuctions = function(req, res, next) {
	FREEAGENTAUCTION.find( { active : false }, function(err, auctions) {
		res.locals.auctions = auctions;
		next();
	});
};

////////
//CREATE
////////

exports.requestNew = function(name, requestingTeam, callback) {
	var message = requestingTeam + " is requesting to start a free agent auction for " + name;
	NOTIFICATION.createNew('FREE_AGENT_AUCTION_REQUEST', name, 1, message, function() {
			callback("The Commisioner has been notified of your request");
	});
	MAILER.sendMail({ 
		from: 'Homer Batsman',
		to: [1],
		subject: "Free Agent Auction Request",
		text: message
	}); 
};

exports.createNew = function(player_id, teams, callback) {
	FREEAGENTAUCTION.findOne( { player_id : player_id }, function(err, data) {
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
					var deadline = new Date(new Date().getTime() + 1*60000);
					FREEAGENTAUCTION.createNew(player.player_id, player.name_display_first_last, deadline, true);

					MAILER.sendMail({ 
						from: 'Homer Batsman',
						to: [1],
						subject: "New Free Agent Auction!",
						html: "<h3>New Free Agent Auction</h3><h1>" + player.name_display_first_last + 
							"</h1><p>The deadline for the auction is " + 
							MOMENT(deadline).format('MMMM Do YYYY, h:mm a [EST]') + 
							". To bid, <a href='http://homeratthebat.herokuapp.com/gm/faa'>click here</a>."
					}); 

					var message = "New Free Agent Auctin: " + player.name_display_first_last
					NOTIFICATION.createNew('FREE_AGENT_AUCTION_STARTED', player.name_display_first_last, 'ALL', message, function() {
							callback(message);
					}, teams);

					SCHEDULE.scheduleJob(deadline, function() {
						FREEAGENTAUCTION.findOne( { player_name : player.name_display_first_last }, function(err, auction) {
							if(auction.active) {
								endAuction(auction._id, function(data, message) {
									console.log("AUCTION IS OVER: " + message);
									
									MAILER.sendMail({ 
										from: 'Homer Batsman',
										to: [1],
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

exports.makeBid = function(_id, bid, teamId, callback) {
	FREEAGENTAUCTION.findOne({ _id : _id }, function(err, data) {
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
			if(data.bids[i].teamId == teamId) {
				existingBid = true;
				data.bids[i].amount = bid;
			}
		}
		if(!existingBid) {
			data.bids.push( { teamId : teamId, amount : bid } );
		}
		data.save();
		callback("Bid successful");
	});
};

/////////////
//END AUCTION
/////////////

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
		}

		if(winningBidCount > 1) {
			callback(data, "There were two or more bids of equal value. Ari will handle this offline.");
			return;
		}

		CASH.findOne( { teamId : winningBid.teamId, year : CONFIG.year, type : 'FA' }, function(err, cash) {
			if(err || !cash) {
				callback(data, "The team with the winning bid did not have the cash they bid.");
				return;
			}
			cash.value -= winningBid.amount;
			cash.save();
		});

		PLAYER.findOne({player_id : data.player_id}, function(err, player) {
			PLAYER.updatePlayerTeam(player, winningBid.teamId, CONFIG.year, function() {
				callback(data, winningBid.teamId + " won with a winning bid of " + winningBid.amount +
					". They may now add the player on ESPN");
			});
		});
	});
}

exports.endAuction = endAuction;