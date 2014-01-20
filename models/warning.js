var mongoose = require("mongoose");
var CONFIG = require("../config/config");

var warningSchema = new mongoose.Schema({
	type: String,
	date: Date,
	player_name: String,
	team: String,
	message: String,
	dismissed: { type: Boolean, default: false} 
}, { collection: 'warnings'});

/////////////////
//ROUTE FUNCTIONS
/////////////////

warningSchema.statics.getWarningsForTeam = function(req, res, next) {
	if(req.user) {
		Warning.find({team : req.user.team, dismissed: false}, function(err, warnings) {
			res.locals.warnings = warnings;
			next();
		})
	} else {
		next();
	}
}

////////
//CREATE
////////

warningSchema.statics.createNew = function(type, player_name, team, message, callback) {
	var warning = new Warning();
	warning.type = type;
	warning.date = new Date();
	warning.player_name = player_name;
	warning.team = team;
	warning.message = message;
	warning.save(function() {
		callback();
	});
}

/////////
//DISMISS
/////////

warningSchema.statics.dismiss = function(id) {
	Warning.findOne({_id : id}, function(err, warning) {
		warning.dismissed = true;
		warning.save();
	})
}

var Warning = mongoose.model('warnings', warningSchema);
module.exports = Warning;