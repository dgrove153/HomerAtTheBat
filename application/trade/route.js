var CASH = require("../../models/cash");
var CONFIG = require("../../config/config").config();
var MLDP = require("../../models/minorLeagueDraftPick");
var TEAM = require("../../models/team");

var getTradeObjects = function(req, res, next) {
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

var getTradeObjectsForTeam = function(teamId, callback) {
	TEAM.findOne({ teamId : teamId }, function(err, team) {
		var data = { team : team };
		data.jsonTeam = JSON.stringify(team);
		CASH.find({team: teamId}).sort({year:1, type:1}).exec(function(err, cash) {
			data.cash = cash;
			data.jsonCash = JSON.stringify(cash);
			MLDP.find({team: teamId }).sort({round:1, overall:1}).exec(function(err, picks) {
				data.picks = picks;
				data.jsonPicks = JSON.stringify(picks);
				TEAM.getPlayers(CONFIG.year, teamId, true, function(players) {
					data.players = players;
					data.jsonPlayers = JSON.stringify(players);
					callback(data);
				});
			});
		});
	});

}

var getOpenTrades = function(req, res, next) {
	var playerIds = [];
	TRADE.find({'to.team':req.params.id, status:'PROPOSED'}, function(err, trades) {
		res.locals.inTrades = trades;
		TRADE.find({'from.team':req.params.id, status:'PROPOSED'}, function(err, trades) {
			res.locals.outTrades = trades;
				next();	
		})
	})
}

module.exports = {
	getTradeObjects : getTradeObjects,
	getTradeObjectsForTeam : getTradeObjectsForTeam,
	getOpenTrades : getOpenTrades
}