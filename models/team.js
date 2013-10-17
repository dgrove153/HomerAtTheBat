var mongoose = require("mongoose");
var Player = require("./player");
var config = require("../config/config");

var teamSchema = mongoose.Schema({
	team: String,
	owner: String,
	fullName: String,
	history: [{
		year: Number,
		keeper_total: Number
	}]
}, { collection: 'teams'});

teamSchema.statics.updateKeepers = function(body) {
	var teamName = body.team;
	this.findOne({ team : teamName }, function(err, team) {
		for(var i = 0; i < team.history.length; i++) {
			if(team.history[i].year == config.year) {
				team.history[i].keeper_total = body.total;
			}
		}
		team.save();
	});
	for(var i = 0; i < body.keepers.length; i++) {
		Player.selectAsKeeper(body.keepers[i], 2014);
	}
	for(var i = 0; i < body.nonkeepers.length; i++) {
		Player.unselectAsKeeper(body.nonkeepers[i], 2014);
	}
};

teamSchema.statics.getList = function(req, res, next) {
	Team.find({}, function(err, teams) {
		if(err) throw err;
		req.teamList = teams;
		console.log(req.teamList);
		next();
	});
};

teamSchema.statics.getPlayers = function(req, res, next) {
	var id = req.params.id;
	var playerList;
	Player.find({ fantasy_team : id }).sort({'history.0.minor_leaguer': 1, 'history.0.salary':-1, name_display_first_last:1}).exec(function(err, doc) {
		req.players = doc;
		next();
	});
};

teamSchema.statics.getInfo = function(req, res, next) {
	Team.findOne({ team : req.params.id }, function(err, team) {
		if(err) { throw new Error(err); }
		req.team = team;
		next();
	});
};

var Team = mongoose.model('Team', teamSchema);
module.exports = Team;
