var TEAM = require("../models/team");
var ASYNC = require("async");
var MLDP = require("../models/minorLeagueDraftPick");
var PLAYER = require("../models/player");
var CONFIG = require('../config/config');
var SCHEDULE = require('node-schedule');
var MAILER = require('../util/mailer');
var MLB = require('../external/mlb');

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
		ASYNC.forEachSeries(rounds, function(round, roundCb) {
			teams.reverse();
			ASYNC.forEachSeries(teams, function(team, teamCb) {
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
//ROUTE FUNCTIONS
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

exports.checkMinorLeagueRosterSize = function(req, res, next) {
	if(req.body.skipped == true || req.body.skipped == "true") {
		next();
		return;
	}
	var team = req.body.team;
	PLAYER.find({fantasy_team : team}, function(err, players) {
		if(err) throw err;
		var count = 0;
		players.forEach(function(p) {
			var historyIndex = PLAYER.findHistoryIndex(p, CONFIG.year);
			if(p.history[historyIndex].minor_leaguer && p.fantasy_status_code != 'A') {
				count++;
			}
		});
		if(count > 10) {
			req.flash('draft_message', "How do you have more than 10 minor leaguers");
			res.redirect("/gm/draft");
		} else if(count == 10) {
			req.flash('draft_message', "You have the maximum 10 minor leaguers on your roster. " + 
				"You must drop one before drafting a new one");
			res.redirect("/gm/draft");
		} else {
			console.log("< 10");
			next();
		}
	});
}

//////////////////
//IN-DRAFT ACTIONS
//////////////////

var updatePick = function(in_pick, player) {
	in_pick.finished = true;
	if(player) {
		in_pick.name_display_first_last = player.name_display_first_last;
		in_pick.player_id = player.player_id;
	}
	
	var deadline = new Date(new Date().getTime() + 60*60000);
	var nextOverall = parseInt(in_pick.overall) + 1;

	var next_pick = {
		overall : nextOverall,
		deadline : deadline
	};

	MLDP.savePick(in_pick);
	MLDP.savePick(next_pick);
	MLDP.findOne({overall : nextOverall}, function(err, pick) {
		MAILER.sendMail({ 
			from: 'Homer Batsman',
			to: [ pick.team ],
			subject: "deadline",
			text: "the deadline for your pick is " + deadline
		});
	});
	SCHEDULE.scheduleJob(deadline, function() {
		MLDP.findOne({overall : nextOverall}, function(err, pick) {
			if(!pick.finished) {
				pick.skipped = true;
				updatePick(pick, null);
			}
		});
	});
}

var draftExistingPlayer = function(player, team, pick, displayMessage) {
	if(player.fantasy_team != undefined && player.fantasy_team != 'FA' && player.fantasy_team != '') {
		displayMessage(player.name_display_first_last + " is already on a team. Please select another player.");
	} else {
		var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
		if(player.history[historyIndex].draft_team == undefined || player.history[historyIndex].draft_team == '') {
			player.history[historyIndex].draft_team = team;
		}
		player.fantasy_status_code = 'MIN';
		PLAYER.updatePlayerTeam(player, team, CONFIG.year, function() {
			updatePick(pick, player);
			displayMessage("You successfully drafted " + player.name_display_first_last);	
		});
	}
}

var draftByName = function(name_display_first_last, fantasyProperties, history, pick, displayMessage) {
	var fantasy_team = fantasyProperties.fantasy_team;
	PLAYER.findOne({ name_display_first_last : name_display_first_last }, function(err, player) {
		if(err) throw err;
		if(player) {
			draftExistingPlayer(player, fantasy_team, pick, displayMessage);
		} else {
			var mlbProperties = {
				name_display_first_last : name_display_first_last
			};
			PLAYER.createNewPlayer(mlbProperties, fantasyProperties, null, history, function(player) {
				updatePick(pick, player);
				displayMessage("You successfully drafted " + name_display_first_last);
			});
		}
	});
}

var draftByPlayerId = function(player_id, fantasyProperties, history, pick, displayMessage) {
	var fantasy_team = fantasyProperties.fantasy_team;
	PLAYER.findOne({player_id: player_id}, function(err, player) {
		if(err) throw err;
		if(player) {
			draftExistingPlayer(player, fantasy_team, pick, displayMessage);
		} else {
			PLAYER.createPlayerWithMLBId(player_id, fantasyProperties, null, history, function(player) {
				if(player == undefined) {
					displayMessage("Sorry, no player with the supplied player id was found. Please try again.");
				} else {
					updatePick(pick, player);
					displayMessage("You successfully drafted " + player.name_display_first_last);
				}
			});
		}
	});	
}

exports.submitPick = function(pick, displayMessage) {
	var player_id = pick.player_id;
	var fantasy_team = pick.team;
	var name_display_first_last = pick.name_display_first_last;

	if(pick.skipped == true || pick.skipped == "true") {
		pick.skipped = true;
		updatePick(pick);
		displayMessage("Your pick has been skipped");
	} else {
		var fantasyProperties = {
			fantasy_team : fantasy_team,
			fantasy_status_code : 'MIN'
		};
		var history = [{
			year : CONFIG.year,
			draft_team : fantasy_team,
			salary : 0,
			contract_year : 0,
			minor_leaguer : true,
			fantasy_team : fantasy_team
		}];
		if(name_display_first_last != undefined && name_display_first_last != "undefined") {
			draftByName(name_display_first_last, fantasyProperties, history, pick, displayMessage);
		} else if(player_id != "undefined") {
			draftByPlayerId(player_id, fantasyProperties, history, pick, displayMessage);
		} else {
			displayMessage("No name or player id was given");
		}
	}
}