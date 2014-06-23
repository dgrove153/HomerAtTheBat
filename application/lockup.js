var CONFIG = require("../config/config").config();
var PLAYER = require("../models/player");

////////
//LOCKUP
////////

exports.lockUpPlayer = function(_id, salary, env, callback) {
	if(CONFIG.isKeeperPeriod)  {
		PLAYER.findOne({ _id : _id}, function(err, player) {
			if(err) throw err;
			
			if(player.isLockUpThisOffseason) {
				callback(player, "This player is already locked up");
			} else if(!player.isKeeper) {
				callback(player, "Please save your keeper selections before locking up the player and then try again");
			} else if(salary < 30) {
				callback(player, "Sorry, a minimum salary of 30 is required in order to lock up a player");
			} else {
				player.isLockUpThisOffseason = true;
				player.save(function() {
					callback(player, player.name_display_first_last + " succesfully locked up!");
				});
			}
		});
	} else {
		callback(player, "Sorry, the lock up period has ended");
	}
};

exports.lockUpPlayer_Remove = function(_id, env, callback) {
	if(CONFIG.isKeeperPeriod) {
		PLAYER.findOne({ _id : _id}, function(err, player) {
			if(err) throw err;

			var historyIndex = player.findHistoryIndex(CONFIG.year);

			if(!player.isLockUpThisOffseason) {
				callback(player, "Sorry, you have not locked up this player");
			} else if(player.history[historyIndex].locked_up) {
				callback(player, "Sorry, this player was locked up in a previous season and cannot be un-locked-up");
			} else {
				player.isLockUpThisOffseason = false;
				player.save(function() {
					callback(player, player.name_display_first_last + " is no longer locked up!");
				});
			}
		});
	} else {
		callback(player, "Sorry, the lock up period has ended");
	}
}