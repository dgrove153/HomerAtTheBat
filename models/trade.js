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
		cashType : String,
		originalTeam : Number,
		swap : {
			swappable : Boolean,
			note : String
		},
		itemText : String
	}],
	status: String,
	deadline: Date
}, { collection: 'trades'});

tradeSchema.statics.getTrades = function(team, callback) {
	Trade.find({ $or: [ { proposedBy : team } , { proposedTo : team} ] }).sort({ deadline : -1 }).exec(function(err, trades) {
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

tradeSchema.statics.getTradesByStatus = function(trades, status) {
	var iTrades = [];
	trades.forEach(function(t) {
		if(t.status === status) {
			iTrades.push(t);
		}
	});
	return iTrades;
}

var Trade = mongoose.model('trade', tradeSchema);
module.exports = Trade;