var mongoose = require("mongoose");
var config = require("../config/config.js");

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
	
	history: [{
		year: Number,
		draft_team: String,
		keeper_team: String,
		salary: Number,
		contract_year: Number,
		minor_leaguer: Boolean,
		locked_up: Boolean,
		fantasy_team: String		
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

playerSchema.statics.lockUpPlayer = function(pid, year) {
	this.findOne({ player_id: pid}, function(err, player) {
		if(err) throw err;
		for(var i = 0; i < player.history.length; i++) {
			if(player.history[i].year == year) {
				player.history[i].locked_up = true;
				console.log('found the year: ' + player.history[i]);
			}
		}
		player.save();
	});
};

playerSchema.statics.getSalaryForYear = function(history, year) {
	for(var i = 0; i < history.length; i++) {
		if(history[i].year == year) {
			return history[i].salary;
		}
	}
};

playerSchema.statics.removePlayerFromTeam = function(p) {
	if(config.isOffseason) {
		var index = this.findHistoryIndex(p, config.year);
		p.history[index].keeper_team = '';
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
