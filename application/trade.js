var TEAM = require("../models/team");
var PLAYER = require("../models/player");
var TRADE = require("../models/trade");

exports.proposeTrade = function(from, to) {
	var from_team = from.team;
	var to_team = to.team;

	var from_players = from.players;
	var to_players = to.players;

	var from_assets = from.assets;
	var to_assets = to.assets;

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
		}
	});

	trade.save();
};