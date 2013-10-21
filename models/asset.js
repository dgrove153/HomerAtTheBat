var mongoose = require("mongoose");

var assetSchema = new mongoose.Schema({
	type: String,
	year: Number,
	value: Number,
	dollar_amount: Number,
	originator: String,
	current_owner: String	
}, { collection: 'assets'});

assetSchema.statics.findForTeam = function(req, res, next) {
	Asset.find({current_owner: req.params.id}, function(err, assets) {
		req.assets = assets;
		next();
	});
}

var Asset = mongoose.model('assets', assetSchema);
module.exports = Asset;

/*
	type: MILB Draft
	year: 2014
	draft_round: 5
	originator: GOB
	current_owner: JEFF

	type: MLB AUCTION $
	year: 2014
	dollar_amount: 5
	originator: GOB
	current_owner: JEFF

	type: FA AUCTION $
	year: 2014
	dollar_amount :20
	originator: GOB
	current_owner: JEFF

	type: MILB DRAFT SWAP RIGHTS
	year: 2014
	draft_round: 3
	originator: GOB
	current_owner: JEFF
*/
