var mongoose = require("mongoose");

var minorLeagueDraftPickSchema = new mongoose.Schema({
	original_team: String,
	team: String,
	year: Number,
	round: Number,
	overall: Number,
	player_id: Number,
	player_name: String,
	skipped : Boolean
}, { collection: 'minorLeagueDraft'});

var MinorLeagueDraftPick = mongoose.model('minorLeagueDraft', minorLeagueDraftPickSchema);
module.exports = MinorLeagueDraftPick;
