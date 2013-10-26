var mongoose = require("mongoose");

var assetSchema = new mongoose.Schema({
	type: String,
	year: Number,
	value: Number,
	originator: String,
	current_owner: String	
}, { collection: 'assets'});

var sort = function(assets) {
	sortedAssets = {};
	sortedAssets.draft_picks = [];
	for(var i = 0; i < assets.length; i++) {
		if(assets[i].type == 'FA_AUCTION_CASH') {
			sortedAssets.fa_auction_cash = assets[i];
		} else if(assets[i].type == 'MILB_DRAFT_PICK' || assets[i].type == 'MILB_DRAFT_SWAP_RIGHTS') {
			sortedAssets.draft_picks.push(assets[i]);
		}
	}
	return sortedAssets;
};

assetSchema.statics.sort = sort;

assetSchema.statics.findForTeam = function(req, res, next) {
	Asset.find({current_owner: req.params.id}).sort({type:1, value:1}).exec(function(err, assets) {
		req.assets = sort(assets);
		next();
	});
}

var Asset = mongoose.model('assets', assetSchema);
module.exports = Asset;
