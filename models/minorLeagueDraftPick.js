var mongoose = require("mongoose");
var ASYNC = require('async');

var minorLeagueDraftPickSchema = new mongoose.Schema({
	//identifiers
	original_team: String,
	year: Number,
	round: Number,

	//pre-draft
	team: String,
	overall: Number,
	swappable: Boolean,
	swapper: String,
	swap_team: String,

	//in-draft
	player_id: Number,
	name_display_first_last: String,
	skipped : Boolean,
	finished: Boolean,
	deadline: Date
}, { collection: 'minorLeagueDraft'});

//////////////
//ROUTE ACCESS
//////////////

minorLeagueDraftPickSchema.statics.findForTeam = function(req, res, next) {
	MinorLeagueDraftPick.find({team:req.params.id}).sort({year:-1, round:1}).exec(function(err, picks) {
		res.locals.picks = picks;
		next();
	});
}

/////////////////
//TRADE FUNCTIONS
/////////////////

minorLeagueDraftPickSchema.statics.getPicksFromRequest = function(req, direction) {
	var pickCount = 0;
	var picks = [];
	console.log("PICK: " + req[direction + "_pick_" + pickCount + "_round"]);
	while(req[direction + "_pick_" + pickCount + "_round"]) {
		var pick = {};
		var pickStr = direction + "_pick_" + pickCount + "_";
		pick.round = req[pickStr + "round"];
		pick.originalteam = req[pickStr + "team"];
		pick.year = req[pickStr + "year"];
		console.log("swap?:" + req[pickStr + "swap"]);
		console.log(req[pickStr + "swap"] == 'true');
		console.log(req[pickStr + "swap"] == true);
		pick.swap = req[pickStr + "swap"] == 'true' ? true : false;
		console.log("the pick: " + pick);
		picks.push(pick);
		pickCount++;
	}
	console.log(picks.length);
	return picks;
}

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
