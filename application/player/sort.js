var PLAYER = require("../../models/player");

var sortByLastName = function(callback) {
	PLAYER.find({}, function(err, players) {
		players.sort(function(a,b) {
			var lastA = a.name_display_first_last.split(' ')[a.name_display_first_last.split(' ').length - 1];
			var lastB = b.name_display_first_last.split(' ')[b.name_display_first_last.split(' ').length - 1];
			if(!lastA || !lastB) {
				return -1;
			}
			if(lastA < lastB) {
				return -1;
			} else if(lastB < lastA) {
				return 1;
			} else {
				return -1;
			}
		});
		callback(players);
	});
}

module.exports = {
	sortByLastName : sortByLastName
}