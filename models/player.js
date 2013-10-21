var mongoose = require("mongoose");
var config = require("../config/config.js");

var playerSchema = mongoose.Schema({
	fantasy_status_code: String,
	status_code: String,
	fantasy_team: String,
	position_txt: String,
	primary_position: String,
	team_name: String,
	name_display_first_last: String,
	team_code: String,
	player_id: Number,
	espn_player_id: String,
	team_id: Number,
	eligible_positions: [String],
	history: [{
		year: Number,
		draft_team: String,
		keeper_team: String,
		salary: Number,
		contract_year: Number,
		minor_leaguer: Boolean,
		locked_up: Boolean			
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
}

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;
