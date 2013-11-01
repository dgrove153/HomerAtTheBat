var TEAM = require("../models/team");
var ASSET = require("../models/asset");
var async = require("async");

var mongoose = require('mongoose');

//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

var teams = [];

var getDraftOrder = function(callback) {
	TEAM.find({}).sort({'history.0.mlb_draft_budget':-1}).exec(function(err, doc) {
		for(var i = 0; i < doc.length; i++) {
			var team = doc[i];
			teams.push(team);
		}
		callback();
	});
}

var getPicks = function(team, callback) {
	team.picks = [];
	ASSET.find({originator:team.team, type:'MILB_DRAFT_PICK'}).sort({value:1}).exec(function(err, doc) {
		if(err) callback(err);
		for(var i = 0; i < doc.length; i++) {
			var pick = doc[i];
			team.picks.push(pick);
		}
		callback();
	});
}

var printDraftOrder = function() {
	for(var i = 0; i < 10; i++) {
		var start, end;
		if(i % 2 == 0) {
			for(var j = 11; j >= 0; j--) {
				console.log(teams[j].picks[i].current_owner + " " + teams[j].picks[i].value);
			}
		} else {
			for(var j = 0; j < 12; j++) {
				console.log(teams[j].picks[i].current_owner + " " + teams[j].picks[i].value);
			}
		}
	}
}

async.series([
	function(callback) {
		getDraftOrder(callback);
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
		printDraftOrder();
		callback();
	}
], function(err) {
	if(err) throw err;
	console.log("done");
}
);