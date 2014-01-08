var mongoose = require("mongoose");
var CONFIG = require("../config/config.js");
var CASH = require("../models/cash");
var ASYNC = require("async");

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

playerSchema.statics.findHistoryIndex = function(player, year) {
	for(var i = 0; i < player.history.length; i++) {
		if(player.history[i].year == year) {
			return i;
		}
	}
	return -1;
};

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

playerSchema.statics.createNewPlayer = function(name, fantasy_team, status, minor_leaguer) {
	var playerModel = this;
	var player = new playerModel({
		fantasy_team: fantasy_team,
		name_display_first_last: name,
		fantasy_status_code: status
	});
	var history = [{
		fantasy_team: fantasy_team,
		draft_team: fantasy_team,
		minor_leaguer: minor_leaguer,
		salary: 0,
		year: CONFIG.year,
	}];
	player.history = history;
	player.save();
	return player;
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

playerSchema.statics.addPlayerToTeam = function(p, teamName) {
	p.fantasy_team = teamName;
	if(CONFIG.isOffseason) {
		p.history[1].fantasy_team = teamName;
	} else {
		p.history[0].fantasy_team = teamName;
	}
}

playerSchema.statics.getMinorLeaguerForYear = function(history, year) {
	for(var i = 0; i < history.length; i++) {
		if(history[i].year == year) {
			return history[i].minor_leaguer;
		}
	}
};

playerSchema.statics.setVultureProperties = function(player) {
	if(player.status_code !== player.fantasy_status_code) {
		player.isVulturable = true;
	} else {
		player.isVulturable = false;
	}

	if(player.vulture != null && player.vulture.is_vultured) {
		player.isVultured = true;
	} else {
		player.isVultured = false;
	}
};

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;
