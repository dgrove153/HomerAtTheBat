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

cashSchema.statics.getFinancesForTeam = function(req, res, next) {
	Cash.find({team:req.params.id}).sort({year:1,type:-1}).exec(function(err, cash) {
		res.locals.cash = cash;
		next();
	});
}

cashSchema.statics.hasFundsForBid = function(req, res, next) {
	Cash.findOne({team:req.body.bid.team, year: CONFIG.year, type:'FA'}, function(err, cash) {
		if(err || !cash) {
			req.flash('info', 'Something went wrong in CASH.hasFundsForBid');
			res.redirect("/");
		}
		if(cash.value < req.body.bid.amount) {
			req.flash('info', 'You do not have enough funds to make that bid');
			res.redirect("/");			
		}
		next();
	});
}

cashSchema.statics.switchFunds = function(from, to, amount, year, type) {
	Cash.findOne({team:from, year:year, type:type}, function(err, cash) {
		if(!cash) {
			cash = new Cash();
			cash.type = type;
			cash.value = defaultCashAmount(type);
			cash.year = year;
			cash.team = from;
		}
		cash.value -= amount;
		cash.save();
		Cash.findOne({team:to, year:year, type:type}, function(err, cash) {
			if(!cash) {
				cash = new Cash();
				cash.type = type;
				cash.value = defaultCashAmount(type);
				cash.year = year;
				cash.team = to;
			}
			cash.value += amount;
			cash.save();
		});
	})
};

var defaultCashAmount = function(type) {
	switch(type)
	{
		case "MLB":
			return 260;
		case "FA":
			return 100;
		default:
			return 0;
	}	

}

var Cash = mongoose.model('cash', cashSchema);
module.exports = Cash;
