var mongoose = require('mongoose');

var tradeSchema = new mongoose.Schema({
	from : {
		team: String,
		players: [],
		picks: []
	},
	to: {
		team: String,
		players: [],
		picks: []
	},
	cash: [],
	status: String,
	deadline: Date
}, { collection: 'trades'});
var Trade = mongoose.model('trade', tradeSchema);
module.exports = Trade;