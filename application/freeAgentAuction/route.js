var ASYNC = require('async');
var CASH = require('../../models/cash');
var CONFIG = require('../../config/config').config();
var FREEAGENTAUCTION = require('../../models/freeAgentAuction');
var PLAYER = require('../../models/player');

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
	if(CONFIG.isOffseason) {
		year = CONFIG.nextYear;
	}
	CASH.findOne({ team : req.user.team, year : year, type:'FA' }, function(err, cash) {
		if(err || !cash) {
			req.flash('message', { isSuccess : false, message : 'Something went wrong in FAA.hasFundsForBid' });
			res.redirect("/");
		}
		else if(cash.value < req.body.bid) {
			req.flash('message', { isSuccess : false, message : 'You do not have enough funds to make that bid' });
			res.redirect("/");			
		} else {
			next();
		}
	});
}

exports.getActiveAuctions = function(req, res, next) {
	FREEAGENTAUCTION.find( { active : true }, function(err, auctions) {
		ASYNC.forEachSeries(auctions, function(auction, cb) {
			PLAYER.findOne({ player_id : auction.player_id }, function(err, player) {
				auction.player = player;
				cb();
			});
		}, function() {
			res.locals.auctions = auctions;
			next();
		});	
	});
};

exports.getActiveAuctionsScrubBids = function(req, res, next) {
	FREEAGENTAUCTION.find( { active : true }, function(err, auctions) {
		ASYNC.forEachSeries(auctions, function(auction, cb) {
			auctions.bids = [];
			cb();
		}, function() {
			res.locals.auctions = auctions;
			next();
		});	
	});
}

exports.getFinishedAuctions = function(req, res, next) {
	FREEAGENTAUCTION.find( { active : false }, function(err, auctions) {
		ASYNC.forEachSeries(auctions, function(auction, cb) {
			auction.bids.forEach(function(b) {
				if(b.teamId == req.user.team) {
					auction.teamBid = b;
				}
			})
			auction.bids = [];
			cb();
		}, function() {
			res.locals.finishedAuctions = auctions;
			next();
		});
	});
};