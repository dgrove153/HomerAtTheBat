var CONFIG = require("../../config/config").config();
var PLAYER = require("../../models/player");
var TEAMSORT = require("../../application/sort");

var getPlayers = function(year, team, onlyMinorLeaguers, callback) {
	var players = [];
	var yearOffset = CONFIG.year - year;
	var players = [];

	var search = { history: { "$elemMatch" : { year: year, fantasy_team : team }}};
	if(onlyMinorLeaguers) {
		search.history['$elemMatch'].minor_leaguer = true;
	}
	PLAYER.find(search, function(err, dbPlayers) {
		if(onlyMinorLeaguers) {
			dbPlayers.sort(TEAMSORT.sortMinorLeaguers);
		}
		dbPlayers.forEach(function(player) {
			player.history_index = player.findHistoryIndex(year);
			player.stats_index = player.findStatsIndex(year);
			console.log(player.stats_index);
		});
		callback(dbPlayers);
	});
};

module.exports = {
	getPlayers : getPlayers
}