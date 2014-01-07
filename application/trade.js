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
	var fromPlayers = [];
	var toPlayers = [];
	TRADE.findOne({_id: req.params.id}, function(err, trade) {
		var from = trade.from;
		var to = trade.to;

		req.trade = trade;
		PLAYER.find({player_id: {$in: from.players}}, function(err, players) {
			req.fromPlayers = players; 
			PLAYER.find({player_id: {$in: to.players}}, function(err, players) {
				req.toPlayers = players;
				next();
			});
		});
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

exports.getTradeObjects = function(req, res, next) {
	var from_team_name = req.user.team;
	var to_team_name = req.params.team;

	// TEAM.getPlayers(2013, from_team_name, function(players) {
	// 	req.from_players = players;
	// 	TEAM.getPlayers(2013, to_team_name, function(players) {
	// 		req.to_players = players;
			TEAM.findOne({team: to_team_name}, function(err, team) {
				req.to_team = team;
				TEAM.findOne({team: from_team_name}, function(err, team) {
					req.from_team = team;
					CASH.find({team: from_team_name}).sort({year:1, type:1}).exec(function(err, cash) {
						req.from_cash = cash;
						CASH.find({team: to_team_name }).sort({year:1, type:1}).exec(function(err, cash) {
							req.to_cash = cash;
							MLDP.find({team: from_team_name }, function(err, picks) {
								req.from_picks = picks;
								MLDP.find({team: to_team_name }, function(err, picks) {
									req.to_picks = picks;
									next();	
								});
							});
						});
					});
				});
			});
	// 	});
	// });
};

////////////////
//TRADE CREATION
////////////////

exports.validateTrade = function(req, callback) {
	var from_team = req.from_team;
	var to_team = req.to_team;

	var from_cash = CASH.getCashFromRequest(req, "from");
	var to_cash = CASH.getCashFromRequest(req, "to");

	var returnMessage;

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
	/*
	var from_players = from.players;
	var to_players = to.players;

	var from_player_names = from.player_names;
	var to_player_names = to.player_names;

	var from_picks = from.picks;
	var to_picks = to.picks;
	*/

	var from_cash = CASH.getCashFromRequest(req, "from");
	var to_cash = CASH.getCashFromRequest(req, "to");

	var from_picks = MLDP.getPicksFromRequest(req, "from");
	var to_picks = MLDP.getPicksFromRequest(req, "to");

	var deadline = new Date();
	deadline.setDate(deadline.getDate() + 1);

	var trade = new TRADE({ 
		from: {
			team: from_team,
			cash: from_cash
		},
		to: {
			team: to_team,
			cash: to_cash
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

		//SWAP PLAYERS
		PLAYER.find({player_id: {$in: from.players}}, function(err, players) {
			for(var i = 0; i < players.length; i++) {
				var p = players[i];
				PLAYER.removePlayerFromTeam(p);
				PLAYER.addPlayerToTeam(p, to.team);
				console.log("new team " + p.fantasy_team + " " + p.name_display_first_last);
				p.save();
			}
			PLAYER.find({player_id: {$in: to.players}}, function(err, players) {
				for(var i = 0; i < players.length; i++) {
					var p = players[i];
					PLAYER.removePlayerFromTeam(p);
					PLAYER.addPlayerToTeam(p, from.team);
					console.log("new team " + p.fantasy_team + " " + p.name_display_first_last);
					p.save();
				}
			});
		});

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