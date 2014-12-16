var mongoose = require("mongoose");
var CONFIG = require("../config/config").config();

var cashSchema = new mongoose.Schema({
	type: String,
	year: Number,
	value: Number,
	team: Number
}, { collection: 'cash'});

cashSchema.statics.getDraftMoney = function(req, res, next) {
	var year = CONFIG.nextYear;
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

	var minYear = CONFIG.isOffseason ? CONFIG.nextYear : CONFIG.year;

	Cash.find( { team : team, year: { $gte : minYear }}).sort({year:1,type:-1}).exec(function(err, cash) {
		res.locals.cash = cash;
		if(CONFIG.isOffseason) {
			var draftYear = CONFIG.nextYear;
			cash.forEach(function(c) {
				if(c.year == draftYear && c.type == 'MLB') {
					res.locals.draftCash = c;
				}
			})
		}
		next();
	});
}

cashSchema.statics.getFinances = function(team, year, callback) {
	var query;
	if(team != undefined) {
		query = Cash.find().where('team').equals(team);
	} else {
		query = Cash.find();
	}
	if(year != undefined) {
		query = query.where('year').equals(year);
	} else {
		query = query.where('year').gte(CONFIG.year);
	}
	var cashByTeam = {};
	query.exec(function(err, cash) {
		cash.forEach(function(c) {
			if(cashByTeam[c.team]) {
				cashByTeam[c.team].push(c);
			} else {
				cashByTeam[c.team] = [ c ];
			}
		});
		callback(cashByTeam);
	});

}

cashSchema.statics.switchFunds = function(from, to, amount, year, type, cb) {
	Cash.findOne({team:from, year:year, type:type}, function(err, cash) {
		if(!cash) {
			cash = new Cash();
			cash.type = type;
			cash.value = defaultCashAmount(type);
			cash.year = year;
			cash.team = from;
		}
		cash.value -= amount;
		cash.save(function() {
			Cash.findOne({team:to, year:year, type:type}, function(err, cash) {
				if(!cash) {
					cash = new Cash();
					cash.type = type;
					cash.value = defaultCashAmount(type);
					cash.year = year;
					cash.team = to;
				}
				cash.value += amount;
				cash.save(function() {
					cb(true);
				});
			});
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
