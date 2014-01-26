var PLAYER = require("../models/player");
var TEAM = require("../models/team");
var CONFIG = require("../config/config");
var CASH = require("../models/cash");

var updateTeamDraftCash = function(teamName, total) {
	CASH.findOne({team:teamName, year:CONFIG.year, type:'MLB'}, function(err, cash) {
		cash.value = total;
		cash.save();
	});
}

var selectPlayerAsKeeper = function(pid) {
	PLAYER.findOne({player_id: pid}, function(err, player) {
		var year = CONFIG.year;
		if(player.history == undefined) {
			player.history = [];
		}
		if(player.history[0] == undefined || player.history[0].year != year) {
			var newHistory = { 
				year: year, 
				locked_up: player.history[0].locked_up,
				minor_leaguer: player.history[0].minor_leaguer
			};
			player.history.unshift(newHistory);
		}
		var salary = player.history[0].locked_up || player.history[0].minor_leaguer ? 
						player.history[1].salary :
						player.history[1].salary + 3;
		player.history[0].salary = salary;
		player.history[0].keeper_team = player.fantasy_team;
		player.history[0].fantasy_team = player.fantasy_team;
		player.history[0].contract_year= player.history[1].minor_leaguer ? 0 : 
											player.history[1].contract_year == undefined ? 1 : player.history[1].contract_year + 1;
		player.save();
	});
};

var selectPlayerAsNonKeeper = function(pid) {
	PLAYER.findOne({player_id: pid}, function(err, player) {
		var year = CONFIG.year;
		if(player.history == undefined) {
			player.history = [];
		}
		if(player.history[0] == undefined || player.history[0].year != year) {
			var newHistory = { 
				year: year
			};
			player.history.unshift(history);
		}
		player.history[0].salary = undefined;
		player.history[0].contract_year = 0;
		player.history[0].keeper_team = '';
		player.history[0].fantasy_team = '';
		player.fantasy_team = '';
		player.save();
	});
};

exports.updateSelections = function(body, callback) {
	updateTeamDraftCash(body.team, body.total);
	for(var i = 0; i < body.keepers.length; i++) {
		selectPlayerAsKeeper(body.keepers[i]);
	}
	for(var i = 0; i < body.nonkeepers.length; i++) {
		selectPlayerAsNonKeeper(body.nonkeepers[i]);
	}
	callback();
};