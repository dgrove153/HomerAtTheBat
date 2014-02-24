var mongoose = require('mongoose');

var tradeSchema = new mongoose.Schema({
	fromTeam : Number,
	toTeam : Number,
	fromReceives : [{
		itemType : String,
		round : Number,
		year : Number,
		amount : Number,
		swap : Boolean
	}],
	toReceives: [{
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