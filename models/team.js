var mongoose = require("mongoose");
var Player = require("./player");

var teamSchema = mongoose.Schema({
	team: String,
	owner: String,
	fullName: String,
	keeper2014Total: Number
}, { collection: 'teams'});

teamSchema.statics.updateKeepers = function(body) {
	var teamName = body.team;
	this.findOne({ team : teamName }, function(err, team) {
		team.keeper2014Total = body.total;
		team.save();
	});
	var keepers = body.keepers;
	for(var i = 0; i < keepers.length; i++) {
		Player.findOne({ playerName: keepers[i]}, function(err, player) {
			player.isKeeper2014 = 1;
			player.save();
		});
	}
	var nonkeepers = body.nonkeepers;
	for(var i = 0; i < nonkeepers.length; i++) {
		Player.findOne({ playerName: nonkeepers[i]}, function(err, player) {
			player.isKeeper2014 = 0;
			player.save();
		});
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
	Player.find({ fantasy_team : id }).sort({'history.minorLeaguer': 1, 'history[0].salary2013':-1}).exec(function(err, doc) {
		playerList = doc;	
		for(var i = 0; i < playerList.length; i++) {
			var pl = playerList[i];
			if(!pl.minorLeaguer) {
				pl.salary2014 = pl.salary2013 + 3;
			} else {
				pl.salary2014 = 0;
			}
		}
		req.players = playerList;
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
