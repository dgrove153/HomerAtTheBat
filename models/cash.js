var mongoose = require("mongoose");
var CONFIG = require("../config/config");

var cashSchema = new mongoose.Schema({
	type: String,
	year: Number,
	value: Number,
	team: String
}, { collection: 'cash'});

cashSchema.statics.getDraftMoney = function(req, res, next) {
	Cash.findOne({team:req.params.id, year:CONFIG.year, type:'MLB'}, function(err, cash) {
		res.locals.cash = cash;
		next();
	});
}

var Cash = mongoose.model('cash', cashSchema);
module.exports = Cash;
