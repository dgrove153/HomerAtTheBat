var mongoose = require("mongoose");

var playerSchema = mongoose.Schema({
	team: String,
	playerName: String,
	salary2013: Number,
	salary2014: Number,
	keeperYear: Number,
	minorLeaguer: Boolean,
}, { collection: 'players'});
exports.Player = mongoose.model('Player', playerSchema);

var teamSchema = mongoose.Schema({
	team: String,
	owner: String,
	fullName: String
}, { collection: 'teams'});
exports.Team = mongoose.model('Team', teamSchema);
