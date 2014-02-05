var TEAM = require("../models/team");
var PLAYER = require("../models/player");
var TRADE = require("../models/trade");
var CONFIG = require("../config/config");
var CASH = require("../models/cash");
var MLDP = require("../models/minorLeagueDraftPick");
var ASYNC = require("async");

///////////////
//ROUTE ACTIONS
///////////////

exports.viewTrade = function(req, res, next) {
	var fromPicks = [];
	var toPicks = [];

	var fromCash = [];
	var toCash = [];

	TRADE.findOne({_id: req.params.id}, function(err, trade) {
		req.tradeFrom = trade.from;
		req.tradeTo = trade.to;
		next();
	});
}

exports.getOpenTrades = function(req, res, next) {
	var playerIds = [];
	TRADE.find({'to.team':req.params.id, status:'PROPOSED'}, function(err, trades) {
		res.locals.inTrades = trades;
		TRADE.find({'from.team':req.params.id, status:'PROPOSED'}, function(err, trades) {
			res.locals.outTrades = trades;
				next();	
		})
	})
}

var getTradeObjectsForTeam = function(team, callback) {
	var data = { team : team };
	CASH.find({team: team}).sort({year:1, type:1}).exec(function(err, cash) {
		data.cash = cash;
		data.jsonCash = JSON.stringify(cash);
		MLDP.find({team: team }).sort({round:1}).exec(function(err, picks) {
			data.picks = picks;
			data.jsonPicks = JSON.stringify(picks);
			callback(data);
		});
	});
}

exports.getTradeObjectsForTeam = getTradeObjectsForTeam;

exports.getTradeObjects = function(req, res, next) {
	var from_team = req.user.team;
	var to_team = req.params.team;
	getTradeObjectsForTeam(from_team, function(data) {
		res.locals.from = data;
		if(to_team) {
			getTradeObjectsForTeam(to_team, function(data) {
				res.locals.to = data;
				next();
			})
		} else {
			next();
		}
	});
};

////////////////
//TRADE CREATION
////////////////

exports.validateTrade = function(body, callback) {
	var from_team = body.from_team;
	var to_team = body.to_team;

	var from_cash = CASH.getCashFromRequest(body, "from");
	var to_cash = CASH.getCashFromRequest(body, "to");

	var errors = [];

	CASH.find({team:from_team}, function(err, moneys) {
		for(var i = 0; i < moneys.length; i++) {
			for(var j = 0; j < from_cash.length; j++) {
				if(moneys[i].type == from_cash[j].type && moneys[i].year == from_cash[j].year) {
					console.log(moneys[i]);
					console.log(from_cash[j]);
					if(moneys[i].value < from_cash[j].value) {
						callback("insufficient funds");
					}
				}
			}
		}
		CASH.find({team:to_team}, function(err, moneys) {
			for(var i = 0; i < moneys.length; i++) {
				for(var j = 0; j < to_cash.length; j++) {
					if(moneys[i].type == to_cash[j].type && moneys[i].year == to_cash[j].year) {
						if(moneys[i].value < to_cash[j].value) {
							callback("insufficient funds");
						}
					}
				}
			}
			callback();
		});
	});
};

exports.proposeTrade = function(req) {
	var from_team = req.from_team;
	var to_team = req.to_team;

	var from_cash = CASH.getCashFromRequest(req, "from");
	var to_cash = CASH.getCashFromRequest(req, "to");

	var from_picks = MLDP.getPicksFromRequest(req, "from");
	var to_picks = MLDP.getPicksFromRequest(req, "to");

	var deadline = new Date();
	deadline.setDate(deadline.getDate() + 1);

	var trade = new TRADE({ 
		from: {
			team: from_team,
			cash: from_cash,
			picks: from_picks
		},
		to: {
			team: to_team,
			cash: to_cash,
			picks: to_picks
		},
		status: 'PROPOSED',
		deadline: deadline
	});

	trade.save();
};

/////////////////
//TRADE DECISIONS
/////////////////

exports.acceptTrade = function(trade_id) {
	TRADE.findOne({_id: trade_id}, function(err, trade) {
		var from = trade.from;
		var to = trade.to;

		//SWAP PICKS
		for(var i = 0; i < from.picks.length; i++) {
			var pick = from.picks[i];
			if(pick.swap) {
				MLDP.swapRights(pick.year, pick.round, from.team, to.team);
			} else {
				MLDP.trade(pick.year, pick.round, pick.original_team, to.team);
			}
		}

		//SWAP CASH
		if(from.cash != undefined) {
			for(var i = 0; i < from.cash.length; i++) {
				var cash = from.cash[i];
				CASH.switchFunds(cash.from, cash.to, cash.amount, cash.year, cash.type);
			}
		}
		if(to.cash != undefined) {
			for(var i = 0; i < to.cash.length; i++) {
				var cash = to.cash[i];
				CASH.switchFunds(cash.from, cash.to, cash.amount, cash.year, cash.type);
			}
		}

		trade.status="ACCEPTED";
		trade.save();
	});
};

exports.cancelTrade = function(trade_id) {
	console.log(trade_id);
	TRADE.findOne({_id: trade_id}, function(err, trade) {
		console.log(trade);
		trade.status = "CANCELLED";
		trade.save();
	});
}

exports.rejectTrade = function(trade_id) {
	TRADE.findOne({_id: trade_id}, function(err, trade) {
		trade.status = "REJECTED";
		trade.save();
	});
}