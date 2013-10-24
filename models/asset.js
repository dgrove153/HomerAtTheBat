var mongoose = require("mongoose");

var assetSchema = new mongoose.Schema({
	type: String,
	year: Number,
	value: Number,
	originator: String,
	current_owner: String	
}, { collection: 'assets'});

assetSchema.statics.findForTeam = function(req, res, next) {
	Asset.find({current_owner: req.params.id}).sort({type:1, value:1}).exec(function(err, assets) {
		req.assets = assets;
		next();
	});
}

var Asset = mongoose.model('assets', assetSchema);
module.exports = Asset;
