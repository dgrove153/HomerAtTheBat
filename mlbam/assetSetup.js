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
			asset.value = j;
			asset.originator = team.team;
			asset.current_owner = team.team;
			asset.save();
		}
	}
});

var lastYearTrans = [
{ "current_owner" : "SHAW", "originator" : "PUIG", "type" : "MLB_DRAFT_CASH", "value" : 8, "year" : 2014 },
{ "current_owner" : "PUIG", "originator" : "MAD", "type" : "MLB_DRAFT_CASH", "value" : 5, "year" : 2014 },
{ "current_owner" : "PUIG", "originator" : "LAZ", "type" : "MLB_DRAFT_CASH", "value" : 8, "year" : 2014 },
{ "current_owner" : "HIV+", "originator" : "SHAW", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2014 },
{ "current_owner" : "PUIG", "originator" : "DBAG", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2014 },
{ "current_owner" : "PUIG", "originator" : "MAD", "type" : "MLB_DRAFT_CASH", "value" : 7, "year" : 2014 },
{ "current_owner" : "DBAG", "originator" : "PUIG", "type" : "FA_AUCTION_CASH", "value" : 1, "year" : 2014 },
{ "current_owner" : "LAZ", "originator" : "PUIG", "type" : "MLB_DRAFT_CASH", "value" : 1, "year" : 2014 },
{ "current_owner" : "CHOB", "originator" : "PUIG", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2014 },
{ "current_owner" : "CHOB", "originator" : "PUIG", "type" : "FA_AUCTION_CASH", "value" : 99, "year" : 2014 },
{ "current_owner" : "CHOB", "originator" : "PUIG", "type" : "MILB_DRAFT_SWAP_RIGHTS", "value" : 1, "year" : 2014 },
{ "current_owner" : "SIDO", "originator" : "GOB", "type" : "MLB_DRAFT_CASH", "value" : 6, "year" : 2014 },
{ "current_owner" : "GRAN", "originator" : "PUIG", "type" : "MLB_DRAFT_CASH", "value" : 10, "year" : 2014 },
{ "current_owner" : "MAD", "originator" : "PUIG", "type" : "MLB_DRAFT_CASH", "value" : 13, "year" : 2014 },
{ "current_owner" : "PUIG", "originator" : "SHAW", "type" : "MLB_DRAFT_CASH", "value" : 8, "year" : 2014 },
{ "current_owner" : "SHAW", "originator" : "GLRY", "type" : "MLB_DRAFT_CASH", "value" : 5, "year" : 2014 },
{ "current_owner" : "HIV+", "originator" : "PUIG", "type" : "MILB_DRAFT_SWAP_RIGHTS", "value" : 4, "year" : 2014 },
{ "current_owner" : "GLRY", "originator" : "GOB", "type" : "MLB_DRAFT_CASH", "value" : 2, "year" : 2014 },
{ "current_owner" : "PUIG", "originator" : "GRAN", "type" : "MLB_DRAFT_CASH", "value" : 7, "year" : 2014 },
{ "current_owner" : "SHAW", "originator" : "GRAN", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2014 },
{ "current_owner" : "SHAW", "originator" : "PUIG", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2014 },
{ "current_owner" : "SHAW", "originator" : "PUIG", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2015 },
{ "current_owner" : "PUIG", "originator" : "MAD", "type" : "MLB_DRAFT_CASH", "value" : 5, "year" : 2014 },
{ "current_owner" : "GLRY", "originator" : "GOB", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2014 },
{ "current_owner" : "SHAW", "originator" : "GLRY", "type" : "MLB_DRAFT_CASH", "value" : 5, "year" : 2014 },
{ "current_owner" : "JEFF", "originator" : "MAD", "type" : "MLB_DRAFT_CASH", "value" : 5, "year" : 2014 },
{ "current_owner" : "PUIG", "originator" : "JEFF", "type" : "MLB_DRAFT_CASH", "value" : 5, "year" : 2014 },
{ "current_owner" : "SIDO", "originator" : "PUIG", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2014 },
{ "current_owner" : "CHOB", "originator" : "GOB", "type" : "MILB_DRAFT_SWAP_RIGHTS", "value" : 3, "year" : 2014 },
{ "current_owner" : "JEFF", "originator" : "CHOB", "type" : "MLB_DRAFT_CASH", "value" : 6, "year" : 2014 },
{ "current_owner" : "MAD", "originator" : "CHOB", "type" : "MLB_DRAFT_CASH", "value" : 3, "year" : 2014 }
];

for (var i = 0; i < lastYearTrans.length; i++) {
	var asset = new Asset(lastYearTrans[i]);
	asset.save();
}