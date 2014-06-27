var AUDIT = require('../../models/externalAudit');
var CONSTANTS = require("../constants");
var CONFIG = require("../../config/config").config();
var PLAYER = require("../../models/player");

var promoteToActiveRoster = function(_id, callback) {
	PLAYER.findOne({ _id : _id }, function(err, player) {
		if(err || !player) {
			callback(false, "Couldn't find player with given id");
		} else {
			player.fantasy_status_code = CONSTANTS.StatusCodes.Active;

			var historyIndex = player.findHistoryIndex(CONFIG.year);
			player.history[historyIndex].minor_leaguer = false;
			player.history[historyIndex].fantasy_position = CONSTANTS.FantasyPosition.Bench;
			player.save(function() {
				callback(true, player.name_display_first_last + " has been promoted to the Active Roster");
			});
		}
	})
}

var demoteToMinorLeagueRoster = function(_id, callback) {
	PLAYER.findOne({ _id : _id }, function(err, player) {
		if(err || !player) {
			callback(false, "Couldn't find player with given id");
		} else {
			player.fantasy_status_code = CONSTANTS.StatusCodes.Minors;

			var historyIndex = player.findHistoryIndex(CONFIG.year);
			player.history[historyIndex].fantasy_position = CONSTANTS.FantasyPosition.Minors;
			player.save(function() {
				callback(true, player.name_display_first_last + " has been demoted to the Minor Leagues");
			});
		}
	})
}

var setMinorLeaguerStatus = function(player, historyIndex, newStatus, logMessage) {
	player.history[historyIndex].minor_leaguer = newStatus;
	player.save();
	AUDIT.auditMinorLeagueStatusSwitch(player.name_display_first_last, player.history[historyIndex].fantasy_team, logMessage);
}

module.exports = {
	promoteToActiveRoster : promoteToActiveRoster,
	demoteToMinorLeagueRoster : demoteToMinorLeagueRoster,
	setMinorLeaguerStatus : setMinorLeaguerStatus
}