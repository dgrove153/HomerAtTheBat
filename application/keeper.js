var PLAYER = require("../models/player");
var TEAM = require("../models/team");
var CONFIG = require("../config/config");

var updateTeam = function(teamName, total) {
	TEAM.findOne({ team : teamName }, function(err, team) {
		for(var i = 0; i < team.history.length; i++) {
			if(team.history[i].year == CONFIG.year) {
				team.history[i].keeper_total = total;
			}
		}
		team.save();
	});
}

var selectPlayerAsKeeper = function(name) {
	PLAYER.findOne({name_display_first_last: name}, function(err, player) {
		var year = CONFIG.year;
		var yearIndex = PLAYER.findHistoryIndex(player, year);
		if(yearIndex == -1) {
			var previousSalary = player.history[0].salary == undefined ? 0 : player.history[0].salary;
			var newSalary;
			if(player.history[0].locked_up) {
				newSalary = previousSalary;
			} else {
				newSalary = player.history[0].minor_leaguer ? previousSalary : previousSalary + 3;
			}
			var history = { year: year, keeper_team: player.fantasy_team, fantasy_team: player.fantasy_team, salary: newSalary };
			player.history.unshift(history);
		} else {
			var previousSalary = player.history[1].salary;
			var newSalary;
			if(player.history[0].locked_up) {
				newSalary = previousSalary;
			} else {
				newSalary = player.history[1].minor_leaguer ? previousSalary : previousSalary + 3;
			}
			player.history[yearIndex].keeper_team = player.fantasy_team;
			player.history[yearIndex].fantasy_team = player.fantasy_team;
			player.history[yearIndex].salary = newSalary;
		}
		player.save();
	});
};

var selectPlayerAsNonKeeper = function(name) {
	PLAYER.findOne({name_display_first_last: name}, function(err, player) {
		var year = CONFIG.year;
		var yearIndex = PLAYER.findHistoryIndex(player, year);
		if(yearIndex == -1) {
			var history = { year: year, keeper_team: '', fantasy_team: '', salary: 0};
			player.history.unshift(history);
		} else {
			player.history[yearIndex].keeper_team = '';
			player.history[yearIndex].fantasy_team = '';
			player.history[yearIndex].salary = 0;
		}
		player.save();
	});
};

exports.updateSelections = function(body) {
	updateTeam(body.team, body.total);
	for(var i = 0; i < body.keepers.length; i++) {
		selectPlayerAsKeeper(body.keepers[i]);
	}
	for(var i = 0; i < body.nonkeepers.length; i++) {
		selectPlayerAsNonKeeper(body.nonkeepers[i]);
	}
};