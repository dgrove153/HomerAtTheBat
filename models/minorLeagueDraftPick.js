var mongoose = require("mongoose");
var ASYNC = require('async');

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

//////////////
//ROUTE ACCESS
//////////////

minorLeagueDraftPickSchema.statics.findForTeam = function(req, res, next) {
	MinorLeagueDraftPick.find({team:req.params.id}).sort({year:-1}).exec(function(err, picks) {
		res.locals.picks = picks;
		next();
	});
}

/////////////////
//TRADE FUNCTIONS
/////////////////

minorLeagueDraftPickSchema.statics.trade = function(year, round, original_team, to) {
	MinorLeagueDraftPick.findOne({year:year, round:round, original_team:original_team}, function(err, pick) {
		if(!pick) {
			pick = new MinorLeagueDraftPick();
			pick.year = year;
			pick.round = round;
			pick.original_team = original_team;
		} 
		pick.team = to;
		pick.save();
	});
}

minorLeagueDraftPickSchema.statics.swapRights = function(year, round, from, to) {
	ASYNC.series([
			function(cb) {
				MinorLeagueDraftPick.findOne({year:year, round:round, original_team: from}, function(err, pick) {
					if(!pick) {
						pick = new MinorLeagueDraftPick();
						pick.year = year;
						pick.round = round;
						pick.original_team = from;
					}
					pick.swappable = true;
					pick.swapper = to;
					pick.save();
					cb();
				});
			},
			function(cb) {
				MinorLeagueDraftPick.findOne({year:year, round:round, original_team: to}, function(err, pick) {
					if(!pick) {
						pick = new MinorLeagueDraftPick();
						pick.year = year;
						pick.round = round;
						pick.original_team = from;
					}
					pick.swappable = true;
					pick.swapper = to;
					pick.swap_team = from;
					pick.save();
					cb();
				})
			}
		], function(err) {
			if(err) throw err;
		}
	);
}

////////
//EXPORT
////////

var MinorLeagueDraftPick = mongoose.model('minorLeagueDraft', minorLeagueDraftPickSchema);
module.exports = MinorLeagueDraftPick;
