var mongoose = require("mongoose");
var CONFIG = require("../config/config");
var CASH = require("../models/cash");
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

	//Add/Drop Properties
	last_team: String,
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
	
	history: [{
		year: Number,
		draft_team: String,
		keeper_team: String,
		salary: Number,
		contract_year: Number,
		minor_leaguer: Boolean,
		locked_up: Boolean,
		fantasy_team: String,
		fantasy_position: String,
	}],
	vulture: {
		is_vultured: { type: Boolean, default: false},
		vulture_team: String,
		vultured_for_pid: Number,
		deadline: Date
	}	
}, { collection: 'mlbplayers'});

////////
//CREATE
////////

playerSchema.statics.createNewPlayer = function(mlbProperties, fantasyProperties, addDropProperties, history, callback) {
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
	player.history = history;
	player.save();
	callback(player);
};

playerSchema.statics.createPlayerWithMLBId = function(playerId, fantasyProperties, addDropProperties, history, callback) {
	MLB.getMLBProperties(playerId, function(mlbProperties) {
		if(mlbProperties == undefined) {
			callback(undefined);
		} else {
			Player.createNewPlayer(mlbProperties, fantasyProperties, addDropProperties, history, callback);
		}
	});
}

////////
//UPDATE
////////

playerSchema.statics.updatePlayerTeam = function(player, team, year, callback) {
	var historyIndex = findHistoryIndex(player, year);
	player.history[historyIndex].fantasy_team = team;
	player.save(function(err, player) {
		if(err) throw err;
		console.log(player.name_display_first_last + " now on " + player.history[0].fantasy_team);
		callback();
	});
}

////////////
//UPDATE MLB
////////////

playerSchema.statics.updatePlayer_MLB = function(mlbProperties, callback) {
	this.findOne({player_id:mlbProperties.player_id}, function(err, player) {
		if(!player) {
			callback(undefined);
			return;
		}
		for (var property in mlbProperties) {
			if (mlbProperties.hasOwnProperty(property)) {
				if(property == 'status_code') {
					player[property] = UTIL.positionToStatus(mlbProperties[property]);
				} else {
					player[property] = mlbProperties[property];
				}
	    	}
		}	
		player.save();
		callback(player);
	});
}

playerSchema.statics.updateMLB_ALL = function(callback) {
	var count = 0;
	this.find({}, function(err, docs) {
		for(var i = 0; i < docs.length; i++) {
			if(docs[i].player_id != undefined) {
				console.log("updating " + docs[i].name_display_first_last);
				MLB.getMLBProperties(docs[i].player_id, function(mlbPlayer) {
					Player.updatePlayer_MLB(mlbPlayer, function(player) {
						count++;
					});
				});
			}
		}
		//callback('updating');
	});
}

/////////////
//UPDATE ESPN
/////////////

var globalCallback;

var savePlayerESPN = function(dbPlayer, position, callback) {
	var historyIndex = findHistoryIndex(dbPlayer, CONFIG.year);
	dbPlayer.history[historyIndex].fantasy_position = position;
	dbPlayer.fantasy_status_code = UTIL.positionToStatus(position);
	dbPlayer.save(function(err) {
		if(err) throw err;
		if(callback) {
			callback(dbPlayer);
		}
	});
}

var parseESPNTransactions_Drop = function(asyncCallback, player, espn_team, text, move, time) {
	AUDIT.isDuplicate('ESPN_TRANSACTION', player.name_display_first_last, 'FA', 'DROP', time, function(isDuplicate) {
		if(!isDuplicate) {
			if(player.history[0].fantasy_team == espn_team) {
				
				if(player.status_code == 'MIN') {
					//this is actually a minor league demotion, not a drop
					console.log(player.name_display_first_last + " is being sent to the minor leagues, not dropped");
					player.fantasy_status_code = 'MIN';
					player.save();
					asyncCallback();	
				} else {
					//set last team properties
					player.last_team = player.history[0].fantasy_team;
					player.last_dropped = time;

					Player.updatePlayerTeam(player, 'FA', CONFIG.year, function() { 
						AUDIT.auditESPNTran(player.name_display_first_last, 'FA', 'DROP', time, 
							player.name_display_first_last + " dropped by " + player.last_team);
						asyncCallback();
					});
				}
			} else {
				//this move is outdated
				console.log(player.name_display_first_last + " not on " + espn_team + ", can't drop");
				asyncCallback();
			}
		} else {
			console.log("dropping " + player.name_display_first_last + " from " + player.last_team + " has already been handled");
			asyncCallback();
		}
	})
};

var parseESPNTransactions_Add = function(asyncCallback, player, espn_team, text, move, time) {
	AUDIT.isDuplicate('ESPN_TRANSACTION', player.name_display_first_last, espn_team, 'ADD', time, function(isDuplicate) {
		if(!isDuplicate) {
			if(player.history[0].fantasy_team != espn_team) {

				if(Player.isMinorLeaguerNotFreeAgent(player, espn_team)) {
					console.log(player.name_display_first_last + " cannot be added to a team because they are a minor leaguer for " +
						player.history[0].fantasy_team);
					var message = 'Your add of ' + player.name_display_first_last + ' is illegal because he is a minor leaguer for ' +
						player.history[0].fantasy_team + '. Please drop them and e-mail Ari to remove the charge.';
					NOTIFICATION.createNew('ILLEGAL_ADD', player.name_display_first_last, espn_team, message, function() {
						asyncCallback();
					});
					return;
				}

				//check to see if we need to reset contract year
				if(Player.shouldResetContractYear(player, espn_team, time)) {
					console.log("changing " + player.name_display_first_last + " contract year to 0");

					var historyIndex = Player.findHistoryIndex(player, CONFIG.year);
					player.history[historyIndex].contract_year = 0;
				}

				Player.updatePlayerTeam(player, espn_team, CONFIG.year, function() { 
					AUDIT.auditESPNTran(player.name_display_first_last, espn_team, 'ADD', time, 
						player.name_display_first_last + " added by " + espn_team);
					asyncCallback();
				});
			} else {
				console.log(player.name_display_first_last + " is already on " + espn_team + ", can't add");
				asyncCallback();
			}
		} else {
			console.log("adding " + player.name_display_first_last + " to " + espn_team + " has already been handled");
			asyncCallback();
		}
	});
}

var parseESPNTransactions_All = function(err, dom) {
	ESPN.parseESPNTransactions(dom, function(rowCB, playerName, team, text, move, time) {
		Player.findOne({name_display_first_last : playerName}, function(err, player) {
			if(player) {
				tranToFunction[move](rowCB, player, team, text, move, time);
			} else {
				console.log(playerName + ' not found');
				rowCB();
			}
		});	
	}, globalCallback);
};

var tranToFunction = {};
tranToFunction.dropped = parseESPNTransactions_Drop;
tranToFunction.added = parseESPNTransactions_Add;
tranToFunction.all = parseESPNTransactions_All;

playerSchema.statics.updateFromESPNLeaguePage = function(callback) {
	ESPN.updateESPN_LeaguePage(undefined, function(id, name, position) {
		Player.updatePlayer_ESPN(id, name, position);
	});
	callback("updating");
}

playerSchema.statics.updatePlayer_ESPN = function(espn_player_id, name, position, callback) {
	this.findOne({espn_player_id : espn_player_id}, function(err, dbPlayer) {
		if(dbPlayer == null) {
			Player.findOne({name_display_first_last : name}, function(err, namePlayer) {
				if(namePlayer == null) {
					namePlayer = new Player();
					namePlayer.name_display_first_last = name;
					namePlayer.history = [{ 
						year: CONFIG.year,
						salary: 0,
					}];
					console.log('adding ' + name);
				}
				namePlayer.espn_player_id = espn_player_id;
				savePlayerESPN(namePlayer, position, callback);
			});
		} else {
			savePlayerESPN(dbPlayer, position, callback);
		}
	});
}

playerSchema.statics.updateFromESPNTransactionsPage = function(type, callback) {
	globalCallback = callback;
	ESPN.updateESPN_Transactions(type, tranToFunction);
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

////////
//SEARCH
////////

playerSchema.statics.findByName = function(p, done) {
	this.findOne({ name_display_first_last: p.name_display_first_last}, function(err, player) {
		if(err) throw err;
		if(!player) {
			console.log("Couldn't find " + p.name_display_first_last);
			return done(null, p);
		} else {
			return done(player, null);
		}
	});
};

////////
//LOCKUP
////////

playerSchema.statics.lockUpPlayer = function(_id, salary, callback) {
	if(CONFIG.isLockupPeriod)  {
		this.findOne({ _id : _id}, function(err, player) {
			if(err) throw err;
			
			var historyIndex = findHistoryIndex(player, CONFIG.year);

			if(player.history[historyIndex].locked_up) {
				callback(player, "This player is already locked up");
			} else if(player.history[historyIndex].fantasy_team != player.history[historyIndex].keeper_team) {
				callback(player, "Please save your keeper selections before locking up the player and then try again");
			} else {
				if(salary >= 30) {
					player.history[historyIndex].locked_up = true;
					player.save();
					callback(player, player.name_display_first_last + " succesfully locked up!");
				} else {
					callback(player, "Sorry, a minimum salary of 30 is required in order to lock up a player");
				}
			}
		});
	} else {
		callback(player, "Sorry, the lock up period has ended");
	}
};

playerSchema.statics.lockUpPlayer_Remove = function(_id, callback) {
	if(CONFIG.isLockupPeriod) {
		this.findOne({ _id : _id}, function(err, player) {
			if(err) throw err;

			var historyIndex = findHistoryIndex(player, CONFIG.year);

			if(!player.history[historyIndex].locked_up) {
				callback(player, "Sorry, you have not locked up this player");
			} else if(player.history[historyIndex + 1] && player.history[historyIndex + 1].locked_up) {
				callback(player, "Sorry, you cannot un-lock up this player");
			} else {
				player.history[historyIndex].locked_up = false;
				player.save();
				callback(player, player.name_display_first_last + " is no longer locked up!");
			}
		});
	} else {
		callback(player, "Sorry, the lock up period has ended");
	}
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

playerSchema.statics.shouldResetContractYear = function(player, espn_team, timeAdded) {
	//if last team to drop the player was this team and they dropped them less than 1 day ago,
	//do not reset contract time
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