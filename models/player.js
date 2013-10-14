var mongoose = require("mongoose");

var playerSchema = mongoose.Schema({
	team: String,
	playerName: String,
	salary2013: Number,
	salary2014: Number,
	keeperYear: Number,
	minorLeaguer: Boolean,
	position: String,
	isKeeper2014: Boolean,
	lockedUp: {
		salary: Number,
		yearsRemaining: Number
	} 
}, { collection: 'players'});
var Player = mongoose.model('Player', playerSchema);
module.exports = Player;
