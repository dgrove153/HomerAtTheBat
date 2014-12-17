var Player = require('../models/player');
var Team = require('../models/team');
var Cash = require('../models/cash');
var mongoose = require('mongoose');
var mldp = require('../models/minorLeagueDraftPick');
var async = require('async');
//Environment variables
var 	env = 'production';//process.env.NODE_ENV || 'development';
var 	config = require('../config/config').setUpEnv(env).config();

//Database connection
mongoose.connect(config.db);

Team.find({}, function(err, teams) {
	var rounds = [1,2,3,4,5];
	var year = 2015;
	async.forEachSeries(rounds, function(round, roundCB) {
		async.forEachSeries(teams, function(team, teamCB) {
			mldp.findOne({year:year, original_team:team.teamId, round: round }, function(err, pick) {
				if(team.teamId == 0) {
					console.log("skipping for team " + team.teamId);
					teamCB();
				} else {
					if(!pick) {
						console.log("creating pick for " + team.teamId + " in round " + round);
						var pick = new mldp({
							year: year,
							team: team.teamId,
							original_team: team.teamId,
							round: round,
							skipped: false
						});
						pick.save(function() {
							teamCB();
						});
						teamCB();
					} else {
						console.log("pick already exists for " + team.teamId + " in round " + round);
						teamCB();
					}
				}
			});
		}, function() {
			roundCB();
		});
	});
});