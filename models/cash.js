var mongoose = require("mongoose");
var CONFIG = require("../config/config");

var cashSchema = new mongoose.Schema({
	type: String,
	year: Number,
	value: Number,
	team: String
}, { collection: 'cash'});

cashSchema.statics.getDraftMoney = function(req, res, next) {
	var year = parseInt(CONFIG.year) + 1;
	Cash.findOne({ team : req.params.id, year : year, type : 'MLB'}, function(err, cash) {
		res.locals.cash = cash;
		next();
	});
}

cashSchema.statics.getFinancesForTeam = function(req, res, next) {
	var team = req.params.id;
	if(!team && req.user) {
		team = req.user.team;
	}
	Cash.find({team:team}).sort({year:1,type:-1}).exec(function(err, cash) {
		res.locals.cash = cash;
		if(CONFIG[req.app.settings.env].isOffseason) {
			var draftYear = CONFIG.getYear(req.app.settings.env);
			cash.forEach(function(c) {
				if(c.year == draftYear && c.type == 'MLB') {
					res.locals.draftCash = c;
				}
			})
		}
		next();
	});
}

cashSchema.statics.getFreeAgentAuctionCash = function(req, res, next) {
	var year = CONFIG.getYear(req.app.settings.env);
	Cash.find({year:year, type:'FA'}, function(err, cashs) {
		res.locals.cashs = cashs;
		next();
	});
}

cashSchema.statics.hasFundsForBid = function(req, res, next) {
	Cash.findOne({team:req.user.team, year: CONFIG.year, type:'FA'}, function(err, cash) {
		if(err || !cash) {
			req.flash('info', 'Something went wrong in CASH.hasFundsForBid');
			res.redirect("/");
		}
		else if(cash.value < req.body.bid) {
			req.flash('info', 'You do not have enough funds to make that bid');
			res.redirect("/");			
		} else {
			next();
		}
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

cashSchema.statics.getCashFromRequest = function(req, direction) {
	var cashCount = 0;
	var cashArray = [];
	while(req[direction + "_cash_" + cashCount + "_type"]) {
		var cash = {};
		var directionString = direction + "_cash_" + cashCount;
		cash.type = req[directionString + "_type"];
		cash.value = req[directionString + "_value"];
		cash.year = req[directionString + "_year"];
		cashArray.push(cash);
		cashCount++;
	}
	return cashArray;
}

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
