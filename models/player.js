var mongoose = require("mongoose");

var playerSchema = mongoose.Schema({
	status_code: String,
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
		contract_year: Number 				
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

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;
