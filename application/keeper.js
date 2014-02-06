var PLAYER = require("../models/player");
var TEAM = require("../models/team");
var CONFIG = require("../config/config");
var CASH = require("../models/cash");

/////////////////
//ROUTE FUNCTIONS
/////////////////

var setKeeperProperties = function(players) {
	players.forEach(function(player) {
		var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
		var history = player.history[historyIndex];	

		setNextYearSalary(player, history);
		setFrontEndProperties(player, history);
		setBackendProperties(player, history);
		
	});
	return players;
}

exports.setKeeperProperties = setKeeperProperties;

exports.updateSelections = function(body, callback) {
	updateTeamDraftCash(body.team, body.total);
	if(body.keepers) {
		for(var i = 0; i < body.keepers.length; i++) {
			selectPlayerAsKeeper(body.team, body.keepers[i]);
		}
	}
	if(body.nonkeepers) {
		for(var i = 0; i < body.nonkeepers.length; i++) {
			selectPlayerAsNonKeeper(body.nonkeepers[i]);
		}
	}
	callback();
};

exports.finalizeKeeperSelections = function() {
	PLAYER.find({}, function(err, players) {
		players = setKeeperProperties(players);
		players.forEach(function(player) {
			var newHistory = {};
			newHistory.year = player.keeper_next_year;
			newHistory.minor_leaguer = player.keeper_minor_leaguer;
			if(player.isKeeper) {
				newHistory.salary = player.nextYearSalary;
				newHistory.fantasy_team = player.keeper_fantasy_team;
				newHistory.keeper_team = player.keeper_fantasy_team;
				newHistory.contract_year = player.keeper_contract_year;
				newHistory.fantasy_position = player.keeper_fantasy_position;
				newHistory.locked_up = player.keeper_locked_up;
			} else {
				newHistory.contract_year = 0;
			}
			player.history.unshift(newHistory);

			player.isKeeper = undefined;
			player.isLockUpThisOffseason = undefined;

			player.save();
		});
	});
}

exports.keepMinorLeaguerAsMajorLeaguer = function(team, pid, prevSalary, shouldBeMajor, callback) {
	PLAYER.findOne({_id : pid}, function(err, player) {
		if(err) throw err;

		player.transferMinorToMajor = shouldBeMajor;

		player.save(function() {
			CASH.findOne({team : team, year : CONFIG.year + 1, type : 'MLB'}, function(err, cash) {
				if(err) throw err;

				if(shouldBeMajor) {
					player = setKeeperProperties([player])[0];
					cash.value -= player.nextYearSalary;	
				} else {
					cash.value += parseInt(prevSalary);
				}
				
				cash.save(function() {
					if(shouldBeMajor) {
						callback(player.name_display_first_last + " will be kept as a major leaguer");
					} else {
						callback(player.name_display_first_last + " will NOT be kept as a major leaguer");
					}
				})
			})
		});
	})
}

/////////
//HELPERS
/////////

var updateTeamDraftCash = function(teamName, total) {
	var year = parseInt(CONFIG.year) + 1;
	CASH.findOne({ team : teamName, year : year, type : 'MLB'}, function(err, cash) {
		cash.value = total;
		cash.save();
	});
}

var selectPlayerAsKeeper = function(team, pid) {
	PLAYER.findOne({_id: pid}, function(err, player) {
		player.isKeeper = true;
		player.save();
	});
};

var selectPlayerAsNonKeeper = function(pid) {
	PLAYER.findOne({_id: pid}, function(err, player) {
		player.isKeeper = false;
		player.save();
	});
};

var setNextYearSalary = function(player, history) {
	var nextYearSalary;
	if(history.minor_leaguer) {
		if(history.salary == undefined || history.salary == '') {
			if(player.transferMinorToMajor) {
				nextYearSalary = 3;
			} else {
				nextYearSalary = 0;
			}
		} else {
			if(player.transferMinorToMajor) {
				nextYearSalary = history.salary + 3;
			} else {
				nextYearSalary = history.salary;
			}
		}
	} else if(history.locked_up) {
		nextYearSalary = history.salary;
	} else {
		nextYearSalary = history.salary + 3;
	}
	player.nextYearSalary = nextYearSalary;
}

var setFrontEndProperties = function(player, history) {
	player.checked = history.locked_up || player.isKeeper;
	player.disabled = history.locked_up || player.isLockUpThisOffseason;	
}

var setBackendProperties = function(player, history) {
	player.keeper_fantasy_team = history.fantasy_team;
	player.keeper_minor_leaguer = history.minor_leaguer;
	player.keeper_locked_up = history.locked_up || player.isLockUpThisOffseason;
	player.keeper_next_year = parseInt(history.year) + 1;
	if(history.minor_leaguer) {
		if(player.transferMinorToMajor) {
			player.keeper_contract_year = history.contract_year + 1;
		} else {
			player.keeper_contract_year = 0;
		}
	}
	else {
		player.keeper_contract_year = parseInt(history.contract_year) + 1;
	}
	player.keeper_fantasy_position = history.fantasy_position;	
}