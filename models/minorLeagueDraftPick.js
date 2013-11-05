var mongoose = require("mongoose");

var minorLeagueDraftPickSchema = new mongoose.Schema({
	original_team: String,
	team: String,
	year: Number,
	round: Number,
	overall: Number,
	player_id: Number,
	name_display_first_last: String,
	skipped : Boolean,
	swappable: Boolean,
	swapper: String,
	swap_team: String
}, { collection: 'minorLeagueDraft'});

minorLeagueDraftPickSchema.statics.findForTeam = function(req, res, next) {
	MinorLeagueDraftPick.find({team:req.params.id}).sort({round:1,overall:1}).exec(function(err, picks) {
		req.picks = picks;
		next();
	});
}

var MinorLeagueDraftPick = mongoose.model('minorLeagueDraft', minorLeagueDraftPickSchema);
module.exports = MinorLeagueDraftPick;
