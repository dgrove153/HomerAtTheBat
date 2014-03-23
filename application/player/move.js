var CONFIG = require("../../config/config").config();
var PLAYER = require("../../models/player");

var sendToMinorLeagues = function(_id, callback) {
	PLAYER.findOne({ _id : _id }, function(err, player) {
		if(err || !player) {
			callback(undefined, "Could not find the specified player");
		} else {
			var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
			player.history[historyIndex].fantasy_position = 'Bench';
			player.save(function() {
				callback(player, "Successfully sent " + player.name_display_first_last + " to the minor leagues");
			});
		}
	});
}

module.exports = {
	sendToMinorLeagues : sendToMinorLeagues
}