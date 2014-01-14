var mongoose = require("mongoose");
var CONFIG = require("../config/config.js");
var CASH = require("../models/cash");
var ASYNC = require("async");
var MLB = require("../external/mlb");
var UTIL = require("../application/util");

var playerSchema = mongoose.Schema({
	//Fantasy Properties
	fantasy_status_code: String,
	fantasy_team: String,
	fantasy_position: String,
	espn_player_id: Number,
	eligible_positions: [String],

	//MLB Properties
	status_code: String,
	player_id: Number,
	position_txt: String,
	primary_position: String,
	team_name: String,
	name_display_first_last: String,
	team_code: String,
	team_id: Number,

	//Add/Drop Properties
	last_team: String,
	last_dropped: Date,

	//Minor League Properties
	at_bats: Number,
	innings_pitched: Number,
	
	history: [{
		year: Number,
		draft_team: String,
		keeper_team: String,
		salary: Number,
		contract_year: Number,
		minor_leaguer: Boolean,
		locked_up: Boolean,
		fantasy_team: String,
		fantasy_position: String
	}],
	vulture: {
		is_vultured: { type: Boolean, default: false},
		vulture_team: String,
		vultured_for_pid: Number,
		deadline: Date
	}	
}, { collection: 'mlbplayers'});

////////
//CREATE
////////

var createNewPlayer = function(mlbProperties, fantasyProperties, addDropProperties, history, callback) {
	var player = new Player();
	for (var property in fantasyProperties) {
		if (fantasyProperties.hasOwnProperty(property)) {
        	player[property] = fantasyProperties[property];
    	}
	}
	for (var property in mlbProperties) {
		if (mlbProperties.hasOwnProperty(property)) {
        	player[property] = mlbProperties[property];
    	}
	}
	for (var property in addDropProperties) {
		if (addDropProperties.hasOwnProperty(property)) {
        	player[property] = addDropProperties[property];
    	}
	}
	player.history = history;
	player.save();
	callback(player);
};

playerSchema.statics.createNewPlayer = createNewPlayer;

playerSchema.statics.createPlayerWithMLBId = function(playerId, fantasyProperties, addDropProperties, history, callback) {
	MLB.getMLBProperties(playerId, function(mlbProperties) {
		if(mlbProperties == undefined) {
			callback(undefined);
		} else {
			createNewPlayer(mlbProperties, fantasyProperties, addDropProperties, history, callback);
		}
	});
}

////////
//UPDATE
////////

playerSchema.statics.updatePlayer_MLB = function(mlbProperties, callback) {
	this.findOne({player_id:mlbProperties.player_id}, function(err, player) {
		if(!player) {
			callback(undefined);
		}
		for (var property in mlbProperties) {
			if (mlbProperties.hasOwnProperty(property)) {
				player[property] = mlbProperties[property];
	    	}
		}	
		player.save();
		callback(player);
	});
}

playerSchema.statics.updateMLB_ALL = function(callback) {
	var count = 0;
	this.find({}, function(err, docs) {
		for(var i = 0; i < docs.length; i++) {
			if(docs[i].player_id != undefined) {
				console.log("updating " + docs[i].name_display_first_last);
				MLB.getMLBProperties(docs[i].player_id, function(mlbPlayer) {
					Player.updatePlayer_MLB(mlbPlayer, function(player) {
						count++;
					});
				});
			}
		}
		callback('updating');
	});
}

playerSchema.statics.updatePlayerTeam = function(player, team, year, callback) {
	var historyIndex = findHistoryIndex(player, year);
	player.fantasy_team = team;
	player.history[historyIndex].fantasy_team = team;
	player.save(function(err) {
		if(err) throw err;
		callback();
	});
}

playerSchema.statics.updatePlayer_ESPN = function(espn_player_id, name, position, callback) {
	this.findOne({espn_player_id: espn_player_id}, function(err, dbPlayer) {
		if(dbPlayer == null) {
			dbPlayer = new Player();
			dbPlayer.fantasy_position = position;
			dbPlayer.name_display_first_last = name;
			dbPlayer.fantasy

			var history = { 
				year: CONFIG.year,
				salary: 0,
			};
			dbPlayer.history = [ history ];
			console.log('adding ' + name);
		}
		var historyIndex = findHistoryIndex(dbPlayer, CONFIG.year);
		dbPlayer.fantasy_position = position;
		dbPlayer.history[historyIndex].fantasy_position = position;
		dbPlayer.fantasy_status_code = UTIL.positionToStatus(position);
		dbPlayer.save(function(err) {
			if(err) throw err;
			callback(dbPlayer);
		});
	});
}

var setMinorLeagueStatus = function(player, historyIndex) {
	if(player.history[historyIndex] && player.history[historyIndex].minor_leaguer) {
		if(player.primary_position == 1) {
			if(player.innings_pitched && player.innings_pitched >= 50) {
				player.history[historyIndex].minor_leaguer = false;
				console.log(player.name_display_first_last + 
					" is marked minor leaguer but pitched " + 
					player.innings_pitched + " innings");
			} else {
				console.log(player.name_display_first_last + 
					" is correctly marked minor leaguer, pitched " + 
					player.innings_pitched + " innings");
			}
		} else {
			if(player.at_bats && player.at_bats >= 150) {
				player.history[historyIndex].minor_leaguer = false;
				console.log(player.name_display_first_last + 
					" is marked minor leaguer but had " + 
					player.at_bats + " at bats");
			} else {
				console.log(player.name_display_first_last + 
					" is correctly marked minor leaguer, had " + 
					player.at_bats + " at bats");
			}
		}
	}
}

var setStatsOnPlayer = function(player, stats) {
	if(stats) {
		player.at_bats = stats.ab;
		player.innings_pitched = stats.ip;
	}
}

playerSchema.statics.updateStats = function(callback) {
	this.find({}, function(err, players) {
		ASYNC.forEachSeries(players, function(player, cb) {
			if(player.player_id && player.primary_position) {
				
				var isHitter = player.primary_position != 1;
				
				console.log('fetching ' + player.name_display_first_last);
				MLB.lookupPlayerStats(player.player_id, isHitter, 2013, function(stats) {
					var historyIndex = findHistoryIndex(player, 2013);
					
					setStatsOnPlayer(player, stats);
					setMinorLeagueStatus(player, historyIndex);
					
					player.save();
					cb();
				});
			} else {
				console.log(player.name_display_first_last + ', player_id: ' + player.player_id + ', primary_position: ' + player.primary_position);
				cb();
			}
		});
	});
}

////////
//SEARCH
////////

playerSchema.statics.findByName = function(p, done) {
	this.findOne({ name_display_first_last: p.name_display_first_last}, function(err, player) {
		if(err) throw err;
		if(!player) {
			console.log("Couldn't find " + p.name_display_first_last);
			return done(null, p);
		} else {
			return done(player, null);
		}
	});
};

////////
//LOCKUP
////////

playerSchema.statics.lockUpPlayer = function(pid, callback) {
	if(CONFIG.isLockupPeriod)  {
		this.findOne({ player_id: pid}, function(err, player) {
			if(err) throw err;
			
			var historyIndex = findHistoryIndex(player, CONFIG.year);

			if(player.history[historyIndex].locked_up) {
				callback("This player is already locked up");
			} else {
				var salary = player.history[historyIndex].salary;
				
				if((salary == undefined || salary == 0) && player.history[historyIndex+1] != undefined) {
					salary = player.history[historyIndex+1].salary;
				}
				
				if(salary >= 30) {
					player.history[historyIndex].locked_up = true;
					player.save();
					callback(player.name_display_first_last + " succesfully locked up!");
				} else {
					callback("Sorry, a minimum salary of 30 is requried in order to lock up a player");
				}
			}
		});
	} else {
		callback("Sorry, the lock up period has ended");
	}
};

/////////
//HELPERS
/////////

var findHistoryIndex = function(player, year) {
	for(var i = 0; i < player.history.length; i++) {
		if(player.history[i].year == year) {
			return i;
		}
	}
	return -1;
};

playerSchema.statics.findHistoryIndex = findHistoryIndex;

playerSchema.statics.shouldResetContractYear = function(player, espn_team, timeAdded) {
	//if last team to drop the player was this team and they dropped them less than 1 day ago,
	//do not reset contract time
	if(player.last_dropped) {
		var contract_year_retain_cutoff = new Date(player.last_dropped.getTime() + 24*60*60000);
		if(player.last_team != espn_team || timeAdded > contract_year_retain_cutoff) {
			return true;
		} else {
			return false;
		}		
	} else {
		return false;
	}
}

playerSchema.statics.isMinorLeaguerNotFreeAgent = function(player, adding_team) {
	var historyIndex = findHistoryIndex(player, CONFIG.year);
	if(player.history[historyIndex].minor_leaguer && 
		player.history[historyIndex].fantasy_team != 'FA' && 
		player.history[historyIndex].fantasy_team != adding_team) {
		return true;
	} else {
		return false;
	}
}

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;