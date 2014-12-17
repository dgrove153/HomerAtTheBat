var CONFIG = require("../../config/config").config();
var CONSTANTS = require("../../application/constants");
var PLAYER = require("../../models/player");
var TEAMSORT = require("../../application/sort");

var getPlayers = function(year, team, onlyMinorLeaguers, callback) {
	var players = [];
	var yearOffset = CONFIG.year - year;
	var players = [];

	var search = { history: { "$elemMatch" : { year: year, fantasy_team : team }}};
	if(onlyMinorLeaguers) {
		search.fantasy_status_code = CONSTANTS.StatusCodes.Minors;
	}
	PLAYER.find(search, function(err, dbPlayers) {
		if(onlyMinorLeaguers) {
			dbPlayers.sort(TEAMSORT.sortMinorLeaguers);
		}
		dbPlayers.forEach(function(player) {
			player.history_index = player.findHistoryIndex(year);
			player.stats_index = player.findStatsIndex(year);
		});
		callback(dbPlayers);
	});
};

module.exports = {
	getPlayers : getPlayers
}