var mongoose = require('mongoose');

var tradeSchema = new mongoose.Schema({
	from : {
		team: String,
		players: [],
		picks: [],
		assets: []
	},
	to: {
		team: String,
		players: [],
		picks: [],
		assets: []
	},
	status: String,
	deadline: Date
}, { collection: 'trades'});
var Trade = mongoose.model('trade', tradeSchema);
module.exports = Trade;