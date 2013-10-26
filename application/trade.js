var TEAM = require("../models/team");
var PLAYER = require("../models/player");
var TRADE = require("../models/trade");
var ASSET = require("../models/asset");
var CONFIG = require("../config/config");

exports.getTradeObjects = function(req, res, next) {
	var from_team_name = req.user.team;
	var to_team_name = req.params.id;
	PLAYER.find({fantasy_team: from_team_name}, function(err, fromPlayers) {
		req.from_players = fromPlayers;
		PLAYER.find({fantasy_team: to_team_name}, function(err, toPlayers) {
			req.to_players = toPlayers;
			ASSET.find({current_owner: from_team_name}, function(err, fromAssets) {
				req.from_assets = ASSET.sort(fromAssets);
				ASSET.find({current_owner: to_team_name}, function(err, toAssets) {
					req.to_assets = ASSET.sort(toAssets);
					TEAM.findOne({team: to_team_name}, function(err, team) {
						req.to_team = team;
						TEAM.findOne({team: from_team_name}, function(err, team) {
							req.from_team = team;
							next();	
						});
					});
				});
			});
		});
	});
};

exports.proposeTrade = function(from, to) {
	var from_team = from.team;
	var to_team = to.team;

	var from_players = from.players;
	var to_players = to.players;

	var from_assets = from.assets;
	var to_assets = to.assets;

	var deadline = new Date();
	deadline.setDate(deadline.getDate() + 1);

	var trade = new TRADE({ 
		from: {
			team: from_team,
			players: from_players,
			assets: from_assets 
		},
		to: {
			team: to_team,
			players: to_players,
			assets: to_assets
		},
		status: 'PROPOSED',
		deadline: deadline
	});

	trade.save();
};

exports.acceptTrade = function(trade_id) {
	TRADE.findOne({_id: trade_id}, function(err, trade) {
		var from = trade.from;
		var to = trade.to;

		PLAYER.find({player_id: {$in: from.players}}, function(err, players) {
			for(var i = 0; i < players.length; i++) {
				var p = players[i];
				PLAYER.removePlayerFromTeam(p);
				p.fantasy_team = to.team;
				console.log("new team " + p.fantasy_team + " " + p.name_display_first_last);
				p.save();
			}
			PLAYER.find({player_id: {$in: to.players}}, function(err, players) {
				for(var i = 0; i < players.length; i++) {
					var p = players[i];
					PLAYER.removePlayerFromTeam(p);
					p.fantasy_team = from.team;
					console.log("new team " + p.fantasy_team + " " + p.name_display_first_last);
					p.save();
				}
			});
		});

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