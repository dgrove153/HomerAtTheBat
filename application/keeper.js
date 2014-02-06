var PLAYER = require("../models/player");
var TEAM = require("../models/team");
var CONFIG = require("../config/config");
var CASH = require("../models/cash");

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
		nextYearSalary = 0;
	} else if(history.locked_up || player.isLockUpThisOffseason) {
		nextYearSalary = history.salary;
	} else {
		nextYearSalary = history.salary + 3;
	}
	player.nextYearSalary = nextYearSalary;
}

var setFrontEndProperties = function(player, history) {
	player.checked = history.locked_up || player.isKeeper;
	player.disabled = history.locked_up;	
}

var setBackendProperties = function(player, history) {
	player.keeper_fantasy_team = history.fantasy_team;
	player.keeper_minor_leaguer = history.minor_leaguer;
	player.keeper_locked_up = history.locked_up || player.isLockUpThisOffseason;
	player.keeper_next_year = parseInt(history.year) + 1;
	if(history.minor_leaguer) {
		player.keeper_contract_year = 0;
	}
	else if(history.contract_year == undefined || history.contract_year == '') {
		player.keeper_contract_year = 1;
	} else {
		player.keeper_contract_year = parseInt(history.contract_year) + 1;
	}
	player.keeper_fantasy_position = history.fantasy_position;	
}

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
	for(var i = 0; i < body.keepers.length; i++) {
		selectPlayerAsKeeper(body.team, body.keepers[i]);
	}
	for(var i = 0; i < body.nonkeepers.length; i++) {
		selectPlayerAsNonKeeper(body.nonkeepers[i]);
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
			player.save();
		});
	});
}