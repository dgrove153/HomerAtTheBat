var TEAM = require("../models/team");
var async = require("async");
var MLDP = require("../models/minorLeagueDraftPick");
var PLAYER = require("../models/player");
var ADMIN = require("./admin");
var CONFIG = require('../config/config');
var SCHEDULE = require('node-schedule');
var MAILER = require('../util/mailer');

/////////////
//DRAFT SETUP
/////////////
exports.createNewDraft = function() {
	TEAM.find({}, function(err, teams) {
		for(var round = 1; round < 11; round++) {
			for(var i = 0; i < teams.length; i++) {
				var pick = new MLDP({
					year: CONFIG.year,
					team: teams[i].team,
					original_team: teams[i].team,
					round: round,
					skipped: false
				});
				pick.save();
			}
		}
	});
}

exports.orderDraft = function() {
	TEAM.find({}).sort({'history.0.mlb_draft_budget':-1}).exec(function(err, teams) {
		var count = 1;
		var rounds = [1,2,3,4,5,6,7,8,9,10];
		async.forEachSeries(rounds, function(round, roundCb) {
			teams.reverse();
			async.forEachSeries(teams, function(team, teamCb) {
				MLDP.findOne({original_team:team.team, round:round}, function(err, pick) {
					pick.overall = count;
					pick.save();
					count++;
					teamCb();
				});
			}, function(err) {
				roundCb();
			});
		});
	});
}

/////////
//GETTERS
/////////

exports.getDraft = function(req, res, next) {
	MLDP.find({year:CONFIG.year}).sort({overall:1}).exec(function(err, picks) {
		req.picks = picks;
		var currentPick;
		for(var i = 0; i < picks.length; i++) {
			if(picks[i].player_id == undefined && picks[i].name_display_first_last  == undefined && !picks[i].skipped) {
				currentPick = i;
				break;
			}
		}
		req.current_pick = picks[currentPick];
		next();
	});
}

//////////////////
//IN-DRAFT ACTIONS
//////////////////

var savePick = function(in_pick, player) {
	MLDP.findOne({overall:in_pick.overall}, function(err, pick) {
		if(in_pick.skipped == true || in_pick.skipped == "true") {
			pick.skipped = true;
		} else {
			pick.player_id = player.player_id;
			pick.name_display_first_last = player.name_display_first_last;
		}
		pick.finished = true;
		pick.save();
		var nextPick = parseInt(in_pick.overall) + 1;
		MLDP.findOne({overall: nextPick}, function(err, pick) {
			if(err) throw err;
			if(pick) {
				pick.deadline = new Date(new Date().getTime() + 1*60000);
				console.log(pick.deadline);
				pick.save();

			   MAILER.sendMail({ 
					from: 'Homer Batsman',
					to: 'arigolub@gmail.com',
					subject: "deadline",
					text: "the deadline for your pick is " + pick.deadline
				}); 
				var k = SCHEDULE.scheduleJob(pick.deadline, function() {
					MLDP.findOne({overall: pick.overall}, function(err, pick) {
						if(!pick.finished) {
							pick.skipped = true;
							savePick(pick, null);
						}
					});
				});
			}
		})
	});
}

var addPickToTeam = function(player, team, pick, callback) {
	player.fantasy_team = team;
	player.history[0].fantasy_team = team;
	//TODO check previous years for draft_team, since they could have been drafted previously
	if(player.history[0].draft_team == undefined || player.history[0].draft_team == '') {
		player.history[0].draft_team = team;
	}
	player.fantasy_status_code = 'ML';
	player.save();
	savePick(pick, player);
	callback("You successfully drafted " + player.name_display_first_last);	
}

exports.submitPick = function(pick, callback) {
	var player_id = pick.player_id;
	var fantasy_team = pick.team;
	var name_display_first_last = pick.name_display_first_last;
	if(pick.skipped == true || pick.skipped == "true") {
		savePick(pick);
		callback("Your pick has been skipped");
	} else {
		if(name_display_first_last != undefined && name_display_first_last.length > 0) {
			PLAYER.findOne({name_display_first_last: name_display_first_last}, function(err, player) {
				if(err) throw err;
				if(player) {
					console.log("FOUND PLAYER: " + player);
					if(player.fantasy_team != undefined && player.fantasy_team != '') {
						callback(player.name_display_first_last + " is already on a team. Please select another player.");
					} else {
						addPickToTeam(player, fantasy_team, pick, callback);
					}
				} else {
					var player = new PLAYER({
						fantasy_team: fantasy_team,
						name_display_first_last: name_display_first_last,
						fantasy_status_code: 'ML'
					});
					var history = [{
						fantasy_team: fantasy_team,
						draft_team: fantasy_team,
						minor_leaguer: true,
						salary: 0,
						year: CONFIG.year,
					}];
					player.history = history;
					player.save();
					savePick(pick, player);
					callback("You successfully drafted " + name_display_first_last);
				}
			});
		} else if(player_id != undefined) {
			PLAYER.findOne({player_id: player_id}, function(err, player) {
				if(err) throw err;
				if(player) {
					if(player.fantasy_team != undefined && player.fantasy_team != '') {
						callback(player.name_display_first_last + " is already on a team. Please select another player.");
					} else {
						addPickToTeam(player, fantasy_team, pick, callback);
					}
				} else {
					ADMIN.findMLBPlayer(player_id, function(json) {
						mlb = json;
						if(mlb == undefined) {
							callback("Sorry, no player with the supplied player id was found. Please try again.");
						} else {
							console.log(mlb);
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
								draft_team: fantasy_team
							}];
							player.history = history;
							player.save();
							savePick(pick, player);
							callback("You successfully drafted " + mlb.name_display_first_last);
						}
					});
				}
			});	
		} else {
			callback("No name or player id was given");
		}
	}
}

///////////
//UTILITIES
///////////

var checkMinorLeagueRosterSize = function(team) {
	PLAYER.find({fantasy_team:team, fantasy_status_code:'ML'}, function(err, docs) {
		if(err) throw err;
		console.log(team + " has " + docs.length + " minor leaguers");
	})
}