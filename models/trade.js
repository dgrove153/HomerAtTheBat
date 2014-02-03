var mongoose = require('mongoose');

var tradeSchema = new mongoose.Schema({
	from : {
		team: String,
		players: [],
		player_names: [],
		picks: [{
			round: Number,
			year: Number,
			isSwap: Boolean
		}],
		cash: [{
			type: String,
			year: Number,
			amount: Number
		}]
	},
	to: {
		team: String,
		players: [],
		player_names: [],
		picks: [{
			round: Number,
			year: Number,
			isSwap: Boolean
		}],
		cash: [{
			type: String,
			year: Number,
			amount: Number
		}]
	},
	status: String,
	deadline: Date
}, { collection: 'trades'});

var Trade = mongoose.model('trade', tradeSchema);
module.exports = Trade;