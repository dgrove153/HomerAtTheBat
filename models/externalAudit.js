var mongoose = require("mongoose");
var CONFIG = require("../config/config");

var externalAuditSchema = new mongoose.Schema({
	type: String,
	date: Date,
	player: String,
	team: String,
	message: String,
	move: String,
	count: Number,
	jobDate: Date
}, { collection: 'externalAudit'});

externalAuditSchema.statics.auditESPNTran = function(player, team, move, date, message) {
	var audit = new ExternalAudit();
	audit.player = player;
	audit.team = team;
	audit.move = move;
	audit.date = date;
	audit.type = 'ESPN_TRANSACTION';
	audit.count = 1;
	audit.jobDate = new Date();
	audit.save();
}

externalAuditSchema.statics.auditMinorLeagueStatusSwitch = function(player, team, message) {
	var audit = new ExternalAudit();
	audit.player = player;
	audit.team = team;
	audit.move = 'minorLeaguer -> MajorLeaguer';
	audit.type = 'MLB_TYPE_SWITCH';
	audit.count = 1;
	audit.jobDate = new Date();
	audit.message = message;
	audit.save();
}

externalAuditSchema.statics.isDuplicate = function(type, player, team, move, date, callback) {
	ExternalAudit.findOne({player:player, team: team, move: move, date: date, type: type}, function(err, audit) {
		if(audit) {
			audit.count++;
			audit.save();
			callback(true);
		} else {
			callback(false);
		}
	});
}

var ExternalAudit = mongoose.model('externalAudit', externalAuditSchema);
module.exports = ExternalAudit;