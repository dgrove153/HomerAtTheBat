var mongoose = require("mongoose");
var CONFIG = require("../config/config").config();

var batterProjectionSchema = new mongoose.Schema({
	Name: String,
	playerid: String,
	team: [{
		user: String,
		team: Number
	}],
	stats: [{
		source: String,
		PA: Number,
		AB: Number,
	    H: Number,
		"2B": Number,
		"3B": Number,
		HR: Number,
	    R: Number,
	    RBI: Number,
	    BB: Number,
	    SO: Number,
	    HBP: Number,
	    SB: Number,
	    CS: Number,
	    AVG: Number,
	    OBP: Number,
	    SLG: Number,
	    OPS: Number,
	    wOBA: Number,
	    BsR: Number,
	    Fld: Number,
	    WAR: Number
		}
	]
}, { collection: 'batterProjections'});

batterProjectionSchema.statics.findTeam = function(projection, user) {
	var team;
	if(!projection.team) {
		team = undefined;
	} else {
		projection.team.forEach(function(_team) {
			if(_team.user === user) {
				team = _team.team;
			}
		});
	}
	return team;
}

batterProjectionSchema.statics.unsetTeam = function(projection, user) {
	if(projection.team) {
		projection.team.forEach(function(_team) {
			if(_team.user === user) {
				_team.team = undefined;
			}
		});
	}
}

batterProjectionSchema.statics.setTeam = function(projection, team, user) {
	if(projection.team) {
		projection.team.forEach(function(_team) {
			if(_team.user === user) {
				_team.team = team;
			}
		})
	} else {
		projection.team = [];
		projection.team.push({ user : user, team : team});
	}
};

var DraftProjection = mongoose.model('batterProjections', batterProjectionSchema);
module.exports = DraftProjection;
