var Team = require('../models/team');
var Asset = require('../models/asset');
var mongoose = require('mongoose');

//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

var content;

Team.find({}, function(err, docs) {
	if(err) throw err;
	for(var i = 0; i < docs.length; i++) {
		var team = docs[i];
		for(var j = 1; j < 11; j++) {
			var asset = new Asset();
			asset.type = "MILB_DRAFT_PICK";
			asset.year = 2014;
			asset.draft_round = j;
			asset.originator = team.team;
			asset.current_owner = team.team;
			asset.save();
		}
	}
});
