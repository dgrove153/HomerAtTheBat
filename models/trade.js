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

var Trade = mongoose.model('trade', tradeSchema);
module.exports = Trade;