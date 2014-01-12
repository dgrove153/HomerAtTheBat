var mongoose = require("mongoose");
var CONFIG = require("../config/config.js");
var CASH = require("../models/cash");
var ASYNC = require("async");
var MLB = require("../external/mlb");

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
				try {
					player[property] = mlbProperties[property];
				} catch(e) {
					console.log(mlbProperties);
					console.log(player);
					console.log(e);
					throw err;
				}
	    	}
		}	
		player.save();
		callback(player);
	});
}

playerSchema.statics.updateTeam = function(player_id, team, year) {
	this.findOne({player_id:player_id}, function(err, player) {
		if(err) throw err;
		var historyIndex = findHistoryIndex(player, year);
		player.fantasy_team = team;
		player.history[historyIndex].fantasy_team = team;
	});
}

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

playerSchema.statics.lockUpPlayer = function(pid, callback) {
	if(CONFIG.isLockupPeriod)  {
		var message = "Sorry, there was an error locking up your player";
		var playerModel = this;
		ASYNC.series(
			[
				function(cb) {
					playerModel.findOne({ player_id: pid}, function(err, player) {
						if(err) throw err;
						for(var i = 0; i < player.history.length; i++) {
							if(player.history[i].year == CONFIG.year) {
								if(player.history[i].locked_up) {
									message = "This player is already locked up";
								} else {
									var salary = player.history[i].salary;
									if(salary == undefined && player.history[i+1] != undefined) {
										salary = player.history[i+1].salary;
									}
									if(salary >= 30) {
										player.history[i].locked_up = true;
										message = player.name_display_first_last + " succesfully locked up!";
									} else {
										message = "Sorry, a minimum salary of 30 is requried in order to lock up a player";
									}
								}
							}
						}
						player.save();
						cb();
					});
				}
			], function(err) {
				if(err) throw err;
				callback(message);
			}
		);
	} else {
		callback("Sorry, the lock up period has ended");
	}
};

playerSchema.statics.getSalaryForYear = function(history, year) {
	for(var i = 0; i < history.length; i++) {
		if(history[i].year == year) {
			return history[i].salary;
		}
	}
};

playerSchema.statics.removePlayerFromTeam = function(p) {
	var oldTeam = p.fantasy_team;
	p.fantasy_team = '';
	if(CONFIG.isOffseason) {
		if(p.history[0].keeper_team != undefined && p.history[0].keeper_team != '') {
			p.history[0].keeper_team = '';
			var salary = p.history[0].salary;
			CASH.findOne({team:oldTeam, type:'MLB', year:CONFIG.year}, function(err, cash) {
				cash.value += salary;
				cash.save();
			});
			p.history[0].salary = 0;
		}
		p.history[1].fantasy_team = '';
	}
	p.history[0].fantasy_team = '';
}

playerSchema.statics.getMinorLeaguerForYear = function(history, year) {
	for(var i = 0; i < history.length; i++) {
		if(history[i].year == year) {
			return history[i].minor_leaguer;
		}
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

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;