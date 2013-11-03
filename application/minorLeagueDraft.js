var TEAM = require("../models/team");
var ASSET = require("../models/asset");
var async = require("async");
var MLDP = require("../models/minorLeagueDraftPick");
var PLAYER = require("../models/player");
var ADMIN = require("./admin");
var CONFIG = require('../config/config');

exports.createNewDraft = function() {
	TEAM.find({}).sort({'history.0.mlb_draft_budget':-1}).exec(function(err, doc) {
		var count = 1;
		for(var round = 1; round < 11; round++) {
			if(round % 2 == 0) {
				for(var i = 11; i >= 0; i--) {
					var pick = new MLDP({
						year: CONFIG.year,
						team: doc[i].team,
						original_team: doc[i].team,
						round: round,
						skipped: false,
						overall: count
					});
					pick.save();
					count++;
				}
			} else {
				for(var i = 0; i < doc.length; i++) {
					var pick = new MLDP({
						year: CONFIG.year,
						team: doc[i].team,
						original_team: doc[i].team,
						round: round,
						skipped: false,
						overall: count
					});
					pick.save();
					count++;
				}
			}
		}
	});
}

exports.getDraft = function(req, res, next) {
	MLDP.find({year:CONFIG.year}).sort({overall:1}).exec(function(err, picks) {
		req.picks = picks;
		var currentPick;
		for(var i = 0; i < picks.length; i++) {
			if(picks[i].player_id == undefined && picks[i].player_name == undefined && !picks[i].skipped) {
				currentPick = i;
				break;
			}
		}
		req.current_pick = picks[currentPick];
		next();
	});
}

var getPicks = function(team, callback) {
	team.picks = [];
	MLDP.find({original_team:team.team}).sort({round:1}).exec(function(err, doc) {
		if(err) callback(err);
		for(var i = 0; i < doc.length; i++) {
			var pick = doc[i];
			team.picks.push(pick);
		}
		callback();
	});
}

var orderDraft = function(teams) {
	var list = [];
	var count = 1;
	for(var i = 0; i < 10; i++) {
		var start, end;
		if(i % 2 == 0) {
			for(var j = 11; j >= 0; j--) {
				teams[j].picks[i].overall = count;
				count++;
				list.push(teams[j].picks[i]);
			}
		} else {
			for(var j = 0; j < 12; j++) {
				teams[j].picks[i].overall = count;
				count++;
				list.push(teams[j].picks[i]);
			}
		}
	}
	return list;
} 

exports.createDraft = function(req, res, next) {
	var teams = [];
	var draftList = [];

	async.series([
		function(callback) {
			getDraftOrder(teams, callback);
		},
		function(callback) {
			async.forEach(teams, 
				function(team, callback) {
					getPicks(team, callback);
				}, function(err) { 
					if(err) throw err;
					callback(); 
				}
			);
		}, function(callback) {
			draftList = orderDraft(teams);
			saveDraft(draftList);
			callback();
		}
	], function(err) {
			if(err) throw err;
		}
	);
}

var submitPick = function(playerId, fantasy_team, playerName) {
	PLAYER.findOne({player_id: playerId}, function(err, player) {
		if(err) throw err;
		if(player) {
			console.log("player: " + player);
			if(player.fantasy_team != undefined && player.fantasy_team != '') {
				throw new Error("Player is already on a team");
			} else {
				player.fantasy_team = fantasy_team;
				player.history[0].fantasy_team = fantasy_team;
				//TODO check previous years for draft_team, since they could have been drafted previously
				if(player.history[0].draft_team == undefined || player.history[0].draft_team == '') {
					player.history[0].draft_team = fantasy_team;
				}
				player.fantasy_status_code = 'ML';
				player.save();
				return;
			}
		} else {
			ADMIN.findMLBPlayer(playerId, function(json) {
				mlb = json;
				if(mlb == undefined) {
					var player = new PLAYER({
						fantasy_team: fantasy_team,
						name_display_first_last: playerName,
						fantasy_status_code: 'ML'
					});
					var history = [{
						fantasy_team: fantasy_team,
						minor_leaguer: true,
						salary: 0,
						year: CONFIG.year,
					}];
					player.history = history;
					player.save();
				} else {
					var player = new PLAYER({
						player_id: mlb.player_id,
						fantasy_team: fantasy_team,
						name_display_first_last: mlb.name_display_first_last,
						position_txt: mlb.position_txt,
						primary_position: mlb.primary_position,
						status_code: mlb.status_code,
						team_code: mlb.team_code,
						team_id: mlb.team_id,
						team_name: mlb.team_name,
						fantasy_status_code: 'ML'
					});
					var history = [{
						fantasy_team: fantasy_team,
						minor_leaguer: true,
						salary: 0,
						year: CONFIG.year,
					}];
					player.history = history;
					player.save();
				}
			});
		}
	});	
}

var checkMinorLeagueRosterSize = function(team) {
	PLAYER.find({fantasy_team:team, fantasy_status_code:'ML'}, function(err, docs) {
		if(err) throw err;
		console.log(team + " has " + docs.length + " minor leaguers");
	})
}

//bichette: 605142
//bundy: 605164
//submitPick(-1, 'GOB', 'Ari Golub');
//checkMinorLeagueRosterSize('PUIG');