var Team = require('../models/team');
var Asset = require('../models/asset');
var FinancialTransaction = require('../models/financialTransaction');
var mongoose = require('mongoose');

//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

var content;
var count = 0;
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
			count++;
		}

		var draftCashAsset = new Asset();
		draftCashAsset.type = "MLB_DRAFT_CASH";
		draftCashAsset.year = 2014;
		draftCashAsset.value = 260;
		draftCashAsset.originator = team.team;
		draftCashAsset.current_owner = team.team;
		draftCashAsset.save();
		count++;

		var faAuctionCash = new Asset();
		faAuctionCash.type = "FA_AUCTION_CASH";
		faAuctionCash.year = 2014;
		faAuctionCash.value = 100;
		faAuctionCash.originator = team.team;
		faAuctionCash.current_owner = team.team;
		faAuctionCash.save();
	}
});

var lastYearTrans = [
{ buyer : "SHAW", seller : "PUIG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 8, "year" : 2014 }},
{ buyer : "PUIG", seller : "MAD", transaction: { tran_type : "MLB_DRAFT_CASH", value : 5, "year" : 2014 }},
{ buyer : "PUIG", seller : "LAZ", transaction: { tran_type : "MLB_DRAFT_CASH", value : 8, "year" : 2014 }},
{ buyer : "HIV+", seller : "SHAW", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2014 }},
{ buyer : "PUIG", seller : "DBAG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2014 }},
{ buyer : "PUIG", seller : "MAD", transaction: { tran_type : "MLB_DRAFT_CASH", value : 7, "year" : 2014 }},
{ buyer : "DBAG", seller : "PUIG", transaction: { tran_type : "FA_AUCTION_CASH", value : 1, "year" : 2014 }},
{ buyer : "LAZ", seller : "PUIG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 1, "year" : 2014 }},
{ buyer : "CHOB", seller : "PUIG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2014 }},
{ buyer : "CHOB", seller : "PUIG", transaction: { tran_type : "FA_AUCTION_CASH", value : 99, "year" : 2014 }},
{ buyer : "CHOB", seller : "PUIG", transaction: { tran_type : "MILB_DRAFT_SWAP_RIGHTS", value : 1, "year" : 2014 }},
{ buyer : "SIDO", seller : "GOB", transaction: { tran_type : "MLB_DRAFT_CASH", value : 6, "year" : 2014 }},
{ buyer : "GRAN", seller : "PUIG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 10, "year" : 2014 }},
{ buyer : "MAD", seller : "PUIG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 13, "year" : 2014 }},
{ buyer : "PUIG", seller : "SHAW", transaction: { tran_type : "MLB_DRAFT_CASH", value : 8, "year" : 2014 }},
{ buyer : "SHAW", seller : "GLRY", transaction: { tran_type : "MLB_DRAFT_CASH", value : 5, "year" : 2014 }},
{ buyer : "HIV+", seller : "PUIG", transaction: { tran_type : "MILB_DRAFT_SWAP_RIGHTS", value : 4, "year" : 2014 }},
{ buyer : "GLRY", seller : "GOB", transaction: { tran_type : "MLB_DRAFT_CASH", value : 2, "year" : 2014 }},
{ buyer : "PUIG", seller : "GRAN", transaction: { tran_type : "MLB_DRAFT_CASH", value : 7, "year" : 2014 }},
{ buyer : "SHAW", seller : "GRAN", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2014 }},
{ buyer : "SHAW", seller : "PUIG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2014 }},
{ buyer : "SHAW", seller : "PUIG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2015 }},
{ buyer : "PUIG", seller : "MAD", transaction: { tran_type : "MLB_DRAFT_CASH", value : 5, "year" : 2014 }},
{ buyer : "GLRY", seller : "GOB", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2014 }},
{ buyer : "SHAW", seller : "GLRY", transaction: { tran_type : "MLB_DRAFT_CASH", value : 5, "year" : 2014 }},
{ buyer : "JEFF", seller : "MAD", transaction: { tran_type : "MLB_DRAFT_CASH", value : 5, "year" : 2014 }},
{ buyer : "PUIG", seller : "JEFF", transaction: { tran_type : "MLB_DRAFT_CASH", value : 5, "year" : 2014 }},
{ buyer : "SIDO", seller : "PUIG", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2014 }},
{ buyer : "CHOB", seller : "GOB", transaction: { tran_type : "MILB_DRAFT_SWAP_RIGHTS", value : 3, "year" : 2014 }},
{ buyer : "JEFF", seller : "CHOB", transaction: { tran_type : "MLB_DRAFT_CASH", value : 6, "year" : 2014 }},
{ buyer : "MAD", seller : "CHOB", transaction: { tran_type : "MLB_DRAFT_CASH", value : 3, "year" : 2014 }}
];

for (var i = 0; i < lastYearTrans.length; i++) {
	count++;
	var finTran = new FinancialTransaction();
	finTran.buyer = lastYearTrans[i].buyer;
	finTran.seller = lastYearTrans[i].seller;
	finTran.transaction = { tran_type : lastYearTrans[i].transaction.tran_type, value: lastYearTrans[i].transaction.value, year : lastYearTrans[i].transaction.year};
	finTran.save();
}
console.log(count);