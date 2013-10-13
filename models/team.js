var mongoose = require("mongoose");

var teamSchema = mongoose.Schema({
	team: String,
	owner: String,
	fullName: String
}, { collection: 'teams'});
var Team = mongoose.model('Team', teamSchema);
module.exports = Team;
