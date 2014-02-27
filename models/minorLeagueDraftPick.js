var mongoose = require("mongoose");
var ASYNC = require('async');
var CONFIG = require('../config/config').config();

var minorLeagueDraftPickSchema = new mongoose.Schema({
	//identifiers
	original_team: Number,
	year: Number,
	round: Number,

	//pre-draft
	team: Number,
	overall: Number,
	swappable: Boolean,
	swapper: Number,
	swap_team: Number,

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
	var teamId = parseInt(req.params.id);
	var year = CONFIG.isOffseason ? CONFIG.nextYear : CONFIG.year;
	MinorLeagueDraftPick.find({ team : teamId, year : { $gte : year }}).sort({year:-1, round:1}).exec(function(err, picks) {
		res.locals.picks = picks;
		next();
	});
}

/////////////////
//DRAFT FUNCTIONS
/////////////////

minorLeagueDraftPickSchema.statics.savePick = function(in_pick) {
	MinorLeagueDraftPick.findOne({overall:in_pick.overall}, function(err, pick) {
		for (var property in in_pick) {
			if (in_pick.hasOwnProperty(property)) {
				pick[property] = in_pick[property];
			}
		}
		pick.save();
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

minorLeagueDraftPickSchema.statics.tradePick = function(year, round, originalOwner, newTeam, isSwap, callback) {
	var swappable = false;
	var swapper = undefined;
	if(isSwap) {
		swappable = true;
		swapper = newTeam;
	}
	MinorLeagueDraftPick.findOne({year : year, round : round, original_team : originalOwner }, function(err, pick) {
		if(!pick) {
			pick = new MinorLeagueDraftPick();
			pick.year = year;
			pick.round = round;
			pick.original_team = originalOwner;
		}
		pick.team = isSwap ? originalOwner : newTeam;
		pick.swappable = swappable;
		pick.swapper = swapper;
		pick.save(function() {
			if(isSwap) {
				MinorLeagueDraftPick.findOne({year:year, round:round, original_team: newTeam }, function(err, pick) {
					if(!pick) {
						pick = new MinorLeagueDraftPick();
						pick.year = year;
						pick.round = round;
						pick.original_team = from;
						pick.team = newTeam;
					}
					pick.swappable = swappable;
					pick.swapper = to;
					pick.swap_team = from;
					pick.save(function() {
						callback();
					});
				});
			} else {
				callback();
			}
		});
	});
}

////////
//EXPORT
////////

var MinorLeagueDraftPick = mongoose.model('minorLeagueDraft', minorLeagueDraftPickSchema);
module.exports = MinorLeagueDraftPick;
