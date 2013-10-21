var TEAM = require("../models/team");
var PLAYER = require("../models/player");
var TRADE = require("../models/trade");
var ASSET = require("../models/asset");

exports.getTradeObjects = function(req, res, next) {
	var from_team_name = req.user.team;
	var to_team_name = req.params.id;
	PLAYER.find({fantasy_team: from_team_name}, function(err, fromPlayers) {
		req.from_players = fromPlayers;
		PLAYER.find({fantasy_team: to_team_name}, function(err, toPlayers) {
			req.to_players = toPlayers;
			ASSET.find({current_owner: from_team_name}, function(err, fromAssets) {
				req.from_assets = fromAssets;
				ASSET.find({current_owner: to_team_name}, function(err, toAssets) {
					req.to_assets = toAssets;
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