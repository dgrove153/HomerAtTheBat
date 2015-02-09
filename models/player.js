var mongoose = require("mongoose");
var CONFIG = require("../config/config").config();
var ASYNC = require("async");
var MLB = require("../external/mlb");
var ESPN = require("../external/espn");
var UTIL = require("../application/util");
var NOTIFICATION = require('../models/notification');
var MOMENT = require('moment');

var playerSchema = mongoose.Schema({
	//Application Properties
	history_index: Number,
	
	//Fantasy Properties
	fantasy_status_code: String,
	espn_player_id: { type : Number, default : 1 },
	eligible_positions: [String],
	espn_player_name : String,

	//MLB Properties
	status_code: String,
	player_id: Number,
	position_txt: String,
	primary_position: String,
	team_name: String,
	team_abbrev: String,
	name_display_first_last: String,
	team_code: String,
	team_id: Number,
	name_first: String,
	name_last: String,

	//Baseball Reference Properties
	bRefUrl: String,

	//Fangraphs Reference Properties
	fangraphsId: String,

	//Add/Drop Properties
	last_team: Number,
	last_dropped: Date,

	//Stats
	stats: [{
		ab: { type : Number, default : 0 },
		ip: { type : Number, default : 0 },
		year: Number,
		r: { type : Number, default : 0 },
		rbi: { type : Number, default : 0 },
		obp: { type : Number, default : -1 },
		hr: { type : Number, default : 0 },
		sb: { type : Number, default : 0 },
		w: { type : Number, default : 0 },
		era: { type : Number, default : -1 },
		so: { type : Number, default : 0 },
		whip: { type : Number, default : -1 },
		sv: { type : Number, default : 0 },
		bb: { type : Number, default : 0 },
		hbp: { type : Number, default : 0 },
		h2b: { type : Number, default : 0 },
		h3b: { type : Number, default : 0 },
		ibb: { type : Number, default : 0 },
		cs: { type : Number, default : 0 },
		sac: { type : Number, default : 0 },
		sf: { type : Number, default : 0 },
		go: { type : Number, default : 0 },
		ao: { type : Number, default : 0 },
		so: { type : Number, default : 0 }
	}],	

	//Stats
	dailyStats: {
		bo : { type : Number, default : 0 },
		s_ip: { type : Number, default : 0 },
		ab: { type : Number, default : 0 },
		ip: { type : Number, default : 0 },
		np: { type : Number, default : 0 },
		year: Number,
		r: { type : Number, default : 0 },
		rbi: { type : Number, default : 0 },
		obp: { type : Number, default : 0 },
		hr: { type : Number, default : 0 },
		sb: { type : Number, default : 0 },
		w: { type : Number, default : 0 },
		era: { type : Number, default : 0 },
		so: { type : Number, default : 0 },
		k: { type : Number, default : 0 },
		whip: { type : Number, default : 0 },
		sv: { type : Number, default : 0 },
		bb: { type : Number, default : 0 },
		hbp: { type : Number, default : 0 },
		h2b: { type : Number, default : 0 },
		h3b: { type : Number, default : 0 },
		ibb: { type : Number, default : 0 },
		cs: { type : Number, default : 0 },
		sac: { type : Number, default : 0 },
		sf: { type : Number, default : 0 },
		go: { type : Number, default : 0 },
		ao: { type : Number, default : 0 },
		so: { type : Number, default : 0 },
		er: { type : Number, default : 0 },
		h: { type : Number, default : 0 },
		hra: { type : Number, default : 0 },
		tbf: { type : Number, default : 0 },
		out: { type : Number, default : 0 },
		game_date: Date
	},

	minorLeague: {
		hr: { type : Number, default : 0 },
		rbi:  { type : Number, default : 0 },
		h2b: { type : Number, default : 0 },
		slg: { type : Number, default : 0 },
		bb:  { type : Number, default : 0 },
		avg: { type : Number, default : 0 },
		obp: { type : Number, default : 0 },
		ops: { type : Number, default : 0 },
		g: { type : Number, default : 0 },
		so: { type : Number, default : 0 },
		h: { type : Number, default : 0 },
		r: { type : Number, default : 0 },
		sb: { type : Number, default : 0 },
		cs: { type : Number, default : 0 },
		h3b: { type : Number, default : 0 },
		ibb: { type : Number, default : 0 },
		ab: { type : Number, default : 0 },
		season: Number
	},

	//Offseason Properties
	isKeeper: Boolean,
	isLockUpThisOffseason: { type : Boolean, default : false },
	transferMinorToMajor: { type : Boolean, default : false },
	isKeeperIneligible: { type: Boolean, default: false },
	
	history: [{
		year: Number,
		draft_team: Number,
		keeper_team: String,
		salary: Number,
		contract_year: { type : Number, default : 0 },
		minor_leaguer: { type : Boolean, default : false },
		locked_up: Boolean,
		fantasy_team: Number,
		fantasy_position: String,
	}],
	vulture: {
		is_vultured: { type: Boolean, default: false},
		vulture_team: Number,
		vultured_for_id: String,
		deadline: Date
	},
	teamByDate: [{
		date : Date,
		team : Number,
		fantasy_status_code : String,
		scoringPeriodId: Number
	}],
	historicalTeamByDate: [{
		date : Date,
		team : Number,
		fantasy_status_code : String,
		scoringPeriodId: Number
	}],
	game : {},
	linescore: {},
	battersTillUp : Number,
	tradeLevel : { type : Number, default : 0 }
}, { collection: 'mlbplayers'});

playerSchema.statics.createNewPlayer = function(mlbProperties, fantasyProperties, addDropProperties, inHistory, callback) {
	var player = new Player();
	for (var property in fantasyProperties) {
		if (fantasyProperties.hasOwnProperty(property)) {
        	player[property] = fantasyProperties[property];
    	}
	}
	for (var property in mlbProperties) {
		if (mlbProperties.hasOwnProperty(property)) {
        	player[property] = mlbProperties[property];
    	}
	}
	for (var property in addDropProperties) {
		if (addDropProperties.hasOwnProperty(property)) {
        	player[property] = addDropProperties[property];
    	}
	}
	var history = inHistory;
	if(!history) {
		history = [{
			year: CONFIG.year,
			fantasy_team: 0
		}];
	}
	player.history = history;
	player.save();
	callback(player);
};

playerSchema.methods.updatePlayerTeam = function(teamId, year, callback) {
	var historyIndex = this.findHistoryIndex(year);
	this.history[historyIndex].fantasy_team = teamId;
	this.save(function(err, dbPlayer) {
		if(err) throw err;
		console.log(dbPlayer.name_display_first_last + " now on " + dbPlayer.history[historyIndex].fantasy_team);
		callback();
	});
}

/////////
//HELPERS
/////////

playerSchema.methods.findStatsIndex = function(year) {
	if(!this.stats) {
		return -1;
	}
	for(var i = 0; i < this.stats.length; i++) {
		if(this.stats[i].year == year) {
			return i;
		}
	}
	return -1;
};

playerSchema.methods.findHistoryIndex = function(year) {
	for(var i = 0; i < this.history.length; i++) {
		if(this.history[i].year == year) {
			return i;
		}
	}
	return -1;
}

//if last team to drop the player was this team and they dropped them less than 1 day ago,
//do not reset contract time
playerSchema.statics.shouldResetContractYear = function(player, espn_team, timeAdded) {
	if(player.last_dropped) {
		var contract_year_retain_cutoff = new Date(player.last_dropped.getTime() + 24*60*60000);
		if(player.last_team != espn_team || timeAdded > contract_year_retain_cutoff) {
			return true;
		} else {
			return false;
		}		
	} else {
		return false;
	}
}

playerSchema.statics.insertMissingTeamByDate = function(suppliedDate, callback) {
	var missingDate = MOMENT(suppliedDate).format('L');
	var missingJavascriptDate = new Date(missingDate);
	var priorDate = new Date(suppliedDate);
	priorDate.setDate(priorDate.getDate() - 1);
	console.log("missing date: " + missingDate);
	console.log("prior date: " + priorDate);
	Player.find({}, function(err, players) {
		ASYNC.forEachSeries(players, function(p, cb) {
			if(p.teamByDate) {
				var dateMissing = true;
				p.teamByDate.forEach(function(t) {
					if(t && t.date.getTime() == missingJavascriptDate.getTime()) {
						dateMissing = false;
					}
				})
				if(dateMissing) {
					var foundIt = false;
					p.teamByDate.forEach(function(t) {
						if(t && t.date.getTime() == priorDate.getTime()) {
							foundIt = true;
							console.log("found team by date for date prior to " + missingJavascriptDate.getTime());
							var dateTeam = { date : missingDate , team : t.team, fantasy_status_code : t.fantasy_status_code };
							p.teamByDate.push(dateTeam);
							p.save(function() {
								cb();
							});
						}
					});
					if(!foundIt) {
						cb();
					}
				} else {
					console.log(p.name_display_first_last + " already had teamByDate for " + priorDate.getTime())
					cb();
				}
			} else {
				cb();
			}
		}, function() {
			callback();
		});
	});

}

playerSchema.statics.updateTeamByDateForSpecificDate = function(_id, date, team, callback) {
	Player.findOne({ _id : _id }, function(err, player) {
		player.teamByDate.forEach(function(t) {
			if(t.date.getTime() == date.getTime()) {
				console.log("changed team by date for " + player.name_display_first_last + " on " + t.date + " to " + team);
				t.team = team;
			}
		});
		player.save(function() {
			callback();
		});
	});
}

playerSchema.statics.addTeamByDateForPlayerDate = function(_id, date, team, callback) {
	Player.findOne({ _id : _id }, function(err, player) {
		var missing = true;
		player.teamByDate.forEach(function(t) {
			if(t != null && t.date.getTime() == date.getTime()) {
				console.log(player.name_display_first_last + " already has teambydate for " + date);
				missing = false;
			}
		});
		if(missing) {
			var newDate = MOMENT(date).format('L');
			var dateTeam = { date : newDate , team : team, fantasy_status_code : 'A' };
			player.teamByDate.push(dateTeam);
			player.save(function() {
				callback();
			});
		} else {
			callback();
		}
	});
}

playerSchema.statics.updateProperty = function(_id, propertyName, newValue, callback) {
	Player.findOne({ _id : _id }, function(err, player) {
		if(err || !player) {
			callback(false, "Could not find player with specified id");
		} else {
			console.log("changing property for " + player.name_display_first_last);
			console.log("Old property: " + player[propertyName]);
			player[propertyName] = newValue;
			console.log("New property: " + player[propertyName]);
			player.save(function() {
				callback(true);
			});
		}
	})
}

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;