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
		batter_bb: { type : Number, default : 0 },
		pitcher_bb: { type : Number, default : 0 },
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
		game_date: Date
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
		team : Number
	}]	
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

var getFantasyTeam = function(player) {
	var historyIndex = findHistoryIndex(player, CONFIG.year);
	return player.history[historyIndex].fantasy_team;
}

playerSchema.statics.getFantasyTeam = getFantasyTeam;

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

var isMinorLeaguer = function(player) {
	var historyIndex = findHistoryIndex(player, CONFIG.year);
	if(player.history[historyIndex].minor_leaguer && 
		player.history[historyIndex].fantasy_team != 0) {
		return true;
	} else {
		return false;
	}
}

playerSchema.statics.isMinorLeaguer = isMinorLeaguer;

playerSchema.statics.isMinorLeaguerNotFreeAgent = function(player, adding_team) {
	var historyIndex = findHistoryIndex(player, CONFIG.year);
	if(isMinorLeaguer(player) && player.history[historyIndex].fantasy_team != adding_team) {
		return true;
	} else {
		return false;
	}
}

playerSchema.statics.updateTeamByDate = function(callback) {
	Player.find({ fantasy_status_code : 'A' }, function(err, players) {
		ASYNC.forEachSeries(players, function(p, cb) {
			var date = MOMENT().format('L');
			var dateTeam = { date : date , team : getFantasyTeam(p) };
			if(p.teamByDate.length > 0) {
				if(MOMENT(date).dayOfYear() == MOMENT(p.teamByDate[p.teamByDate.length - 1].date).dayOfYear()) {
					p.teamByDate[p.teamByDate.length - 1].team = getFantasyTeam(p);
				} else {
					p.teamByDate.push(dateTeam);
				}
			} else {
				p.teamByDate.push(dateTeam);
			}
			p.save(function() {
				cb();
			});
		}, function() {
			callback();
		});
	});
}

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;