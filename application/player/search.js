var CONFIG = require("../../config/config").config();
var PLAYER = require("../../models/player");

var findPlayersMissingESPNIds = function(cb) {
	PLAYER.find({ $or : [ { espn_player_id : { $exists : false }} , { espn_player_id : 1 } ] })
		.sort({ name_display_first_last : 1 })
		.exec(function(err, players) {
			if(err) throw err;
			cb(players);
		}
	);
};

var findFreeAgents = function(parameters, cb) {
	var search = {};
	if(parameters.history) {
		search.history = { "$elemMatch" : parameters.history };
	}
	if(parameters.positions) {
		search.primary_position = { "$in" : parameters.positions };
	}
	if(parameters.forceStats) {
		search.stats = { "$exists" : true };
	}
	if(parameters.categories) {
		search.stats = { "$elemMatch" : {} };
		parameters.categories.forEach(function(c) {
			var category = {};
			if(c.gtLt == "1") {
				category["$gte"] = c.value;
			} else {
				category["$lte"] = c.value;
			}
			search.stats["$elemMatch"][c.name] = category;
		});
		search.stats["$elemMatch"].year = CONFIG.year;
		console.log(search.stats);
	}
	PLAYER.find(search).sort({ name_last : 1 }).exec(function(err, freeAgents) {
		var batters = [];
		var pitchers = [];
		freeAgents.forEach(function(player) {
			if(player.primary_position != 1) {
				batters.push(player);
			} else {
				pitchers.push(player);
			}
		});
		cb(batters, pitchers);
	});
}

module.exports = {
	findPlayersMissingESPNIds : findPlayersMissingESPNIds,
	findFreeAgents : findFreeAgents
}