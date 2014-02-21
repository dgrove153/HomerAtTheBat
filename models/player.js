var mongoose = require("mongoose");
var CONFIG = require("../config/config").config();
var ASYNC = require("async");
var MLB = require("../external/mlb");
var ESPN = require("../external/espn");
var UTIL = require("../application/util");
var AUDIT = require('../models/externalAudit');
var NOTIFICATION = require('../models/notification');

var playerSchema = mongoose.Schema({
	//Fantasy Properties
	fantasy_status_code: String,
	espn_player_id: Number,
	eligible_positions: [String],

	//MLB Properties
	status_code: String,
	player_id: Number,
	position_txt: String,
	primary_position: String,
	team_name: String,
	name_display_first_last: String,
	team_code: String,
	team_id: Number,

	//Baseball Reference Properties
	bRefUrl: String,

	//Fangraphs Reference Properties
	fangraphsId: String,

	//Add/Drop Properties
	last_team: Number,
	last_dropped: Date,

	//Stats
	stats: [{
		at_bats: Number,
		innings_pitched: Number,
		year: Number,
		r: Number,
		rbi: Number,
		obp: Number,
		hr: Number,
		sb: Number,
		w: Number,
		era: Number,
		so: Number,
		whip: Number,
		s: Number
	}],	

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
		vultured_for_pid: Number,
		deadline: Date
	}	
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

playerSchema.statics.updatePlayerTeam = function(player, teamId, year, callback) {
	var historyIndex = findHistoryIndex(player, year);
	player.history[historyIndex].fantasy_team = teamId;
	player.save(function(err, player) {
		if(err) throw err;
		console.log(player.name_display_first_last + " now on " + player.history[0].fantasy_team);
		callback();
	});
}

//////////////
//UPDATE STATS
//////////////

playerSchema.statics.updateStats = function(onlyMinorLeaguers, callback) {
	var statsYear = CONFIG.year;
	this.find({}).sort({name_display_first_last:1}).exec(function(err, players) {
		ASYNC.forEachSeries(players, function(player, cb) {
			if(player.player_id && player.primary_position) {
				
				var isHitter = player.primary_position != 1;
				var historyIndex = findHistoryIndex(player, statsYear);

				if(!onlyMinorLeaguers || player.history[historyIndex].minor_leaguer) {
					console.log('fetching ' + player.name_display_first_last);
					MLB.lookupPlayerStats(player.player_id, isHitter, statsYear, function(stats) {
						var historyIndex = findHistoryIndex(player, statsYear);
						
						setStatsOnPlayer(player, stats, statsYear, isHitter);
						setMinorLeagueStatus(player, historyIndex, isHitter, statsYear);
						
						player.save();
						cb();
					});
				} else {
					cb();
				}
			} else {
				console.log(player.name_display_first_last + ', player_id: ' + player.player_id + ', primary_position: ' + player.primary_position);
				cb();
			}
		}, function(err) {
			if(callback) {
				callback();
			}
		});
	});
}

var setStatsOnPlayer = function(player, stats, statsYear, isHitter) {
	var statsIndex = findStatsIndex(player, statsYear);
	if(statsIndex == -1) {
		player.stats.unshift({ year: statsYear });
		statsIndex = 0;
	}
	if(stats) {
		if(isHitter) {
			player.stats[statsIndex].at_bats = stats.ab;
			player.stats[statsIndex].r = stats.r;
			player.stats[statsIndex].rbi = stats.rbi;
			player.stats[statsIndex].obp = stats.obp;
			player.stats[statsIndex].sb = stats.sb;
			player.stats[statsIndex].hr = stats.hr;
		} else {
			player.stats[statsIndex].innings_pitched = stats.ip;
			player.stats[statsIndex].w = stats.w;
			player.stats[statsIndex].era = stats.era;
			player.stats[statsIndex].so = stats.so;
			player.stats[statsIndex].whip = stats.whip;
			player.stats[statsIndex].sv = stats.sv;
		}
	}
}

var setMinorLeagueStatus = function(player, historyIndex, isHitter, statsYear) {
	var stats = findStatsIndex(player, statsYear);
	if(player.history[historyIndex] && player.history[historyIndex].minor_leaguer) {
		if(!isHitter) {
			if(stats.innings_pitched && stats.innings_pitched >= CONFIG.minorLeaguerInningsPitchedThreshhold) {
				switchMinorLeaguerToMajorLeaguer(player, historyIndex, stats);
			}
		} else {
			if(stats.at_bats && stats.at_bats >= CONFIG.minorLeaguerAtBatsThreshhold) {
				switchMinorLeaguerToMajorLeaguer(player, historyIndex, stats);
			}
		}
	}
}

var switchMinorLeaguerToMajorLeaguer = function(player, historyIndex, stats) {
	player.history[historyIndex].minor_leaguer = false;

	var name = player.name_display_first_last;
	console.log(name + " going from minor leaguer to major leaguer");

	AUDIT.auditMinorLeagueStatusSwitch(player.name_display_first_last, 
		player.history[0].fantasy_team, "AB: " + stats.at_bats + ", IP: " + stats.innings_pitched);
}

/////////
//HELPERS
/////////

var findHistoryIndex = function(player, year) {
	for(var i = 0; i < player.history.length; i++) {
		if(player.history[i].year == year) {
			return i;
		}
	}
	return -1;
};

var findStatsIndex = function(player, year) {
	if(!player.stats) {
		return -1;
	}
	for(var i = 0; i < player.stats.length; i++) {
		if(player.stats[i].year == year) {
			return i;
		}
	}
	return -1;
};

playerSchema.statics.findHistoryIndex = findHistoryIndex;
playerSchema.statics.findStatsIndex = findStatsIndex;

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

playerSchema.statics.isMinorLeaguerNotFreeAgent = function(player, adding_team) {
	var historyIndex = findHistoryIndex(player, CONFIG.year);
	if(player.history[historyIndex].minor_leaguer && 
		player.history[historyIndex].fantasy_team != 'FA' && 
		player.history[historyIndex].fantasy_team != adding_team) {
		return true;
	} else {
		return false;
	}
}

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;