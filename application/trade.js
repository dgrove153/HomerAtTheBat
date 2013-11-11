var TEAM = require("../models/team");
var PLAYER = require("../models/player");
var TRADE = require("../models/trade");
var ASSET = require("../models/asset");
var CONFIG = require("../config/config");
var CASH = require("../models/cash");
var MLDP = require("../models/minorLeagueDraftPick");

///////////////
//ROUTE ACTIONS
///////////////

exports.viewTrade = function(req, res, next) {
	var fromPlayers = [];
	var toPlayers = [];
	var fromAssets = [];
	var toAssets = [];
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
		// for(var i = 0; i < trades.length; i++) {
		// 	var trade = trades[i];
		// 	for(var j = 0; j < trade.from.players.length; j++) {
		// 		playerIds.push(trade.from.players[j]);
		// 	}
		// }
		TRADE.find({'from.team':req.params.id, status:'PROPOSED'}, function(err, trades) {
			res.locals.outTrades = trades;
			// for(var i = 0; i < trades.length; i++) {
			// 	var trade = trades[i];
			// 	for(var j = 0; j < trade.to.players.length; j++) {
			// 		playerIds.push(trade.to.players[j]);
			// 	}
			// }
			//PLAYER.find({player_id: {$in: playerIds}}, function(err, players) {
			//	res.locals.trade_players = players;
				next();	
			//});
		})
	})
}

exports.getTradeObjects = function(req, res, next) {
	var from_team_name = req.user.team;
	var to_team_name = req.params.id;

	TEAM.getPlayers(2013, from_team_name, function(players) {
		req.from_players = players;
		TEAM.getPlayers(2013, to_team_name, function(players) {
			req.to_players = players;
			TEAM.findOne({team: to_team_name}, function(err, team) {
				req.to_team = team;
				TEAM.findOne({team: from_team_name}, function(err, team) {
					req.from_team = team;
					CASH.find({team: from_team_name, year:2014}, function(err, cash) {
						req.from_cash = cash;
						CASH.find({team: to_team_name, year:2014}, function(err, cash) {
							req.to_cash = cash;
							next();	
						});
					});
				});
			});
		});
	});
};

////////////////
//TRADE CREATION
////////////////

exports.proposeTrade = function(from, to) {
	var from_team = from.team;
	var to_team = to.team;

	var from_players = from.players;
	var to_players = to.players;

	var from_player_names = from.player_names;
	var to_player_names = to.player_names;

	var from_picks = from.picks;
	var to_picks = to.picks;

	var from_assets = from.assets;
	var to_assets = to.assets;

	var deadline = new Date();
	deadline.setDate(deadline.getDate() + 1);

	var trade = new TRADE({ 
		from: {
			team: from_team,
			players: from_players,
			player_names: from_player_names
		},
		to: {
			team: to_team,
			players: to_players,
			player_names: to_player_names
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
		if(trade.cash != undefined) {
			for(var i = 0; i < trade.cash.length; i++) {
				var cash = trade.cash[i];
				CASH.switchFunds(cash.from, cash.to, cash.amount, cash.year, cash.type);
			}
		}

		trade.status="ACCEPTED";
		trade.save();
	});
};

exports.rejectTrade = function(trade_id) {
	TRADE.findOne({_id: trade_id}, function(err, trade) {
		trade.status = "REJECTED";
		trade.save();
	});
}