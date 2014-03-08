var PLAYER = require("../../models/player");

var findPlayersMissingESPNIds = function(cb) {
	PLAYER.find({ $or : [ { espn_player_id : { $exists : false }} , { espn_player_id : 1 } ] }, function(err, players) {
		if(err) throw err;
		cb(players);
	});
};

module.exports = {
	findPlayersMissingESPNIds : findPlayersMissingESPNIds
}