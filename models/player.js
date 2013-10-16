var mongoose = require("mongoose");

var playerSchema = mongoose.Schema({
	status_code: String,
	fantasy_team: String,
	position_txt: String,
	primary_position: String,
	team_name: String,
	name_display_first_last: String,
	team_code: String,
	player_id: Number,
	team_id: Number,
	history: [{
		year: Number,
		draft_team: String,
		keeper_team: String,
		salary: Number,
		contract_year: Number,
		minor_leaguer: Boolean,
		locked_up: Boolean			
	}]	
}, { collection: 'mlbplayers'});

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

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;
