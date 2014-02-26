var mongoose = require('mongoose');

var tradeSchema = new mongoose.Schema({
	proposedBy: Number,
	proposedTo: Number,
	items : [{
		from : Number,
		to : Number,
		itemType : String,
		round : Number,
		year : Number,
		amount : Number,
		swap : Boolean
	}],
	status: String,
	deadline: Date
}, { collection: 'trades'});

tradeSchema.statics.getTrades = function(team, status, callback) {
	Trade.find({ status : status, $or: [ { proposedBy : team } , { proposedTo : team} ] }, function(err, trades) {
		callback(trades);
	});
};

tradeSchema.statics.getTradesByDirection = function(team, trades, direction) {
	var iTrades = [];
	trades.forEach(function(t) {
		if(t[direction] == team) {
			iTrades.push(t);
		}
	});
	return iTrades;
}

var Trade = mongoose.model('trade', tradeSchema);
module.exports = Trade;