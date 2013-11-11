var mongoose = require('mongoose');

var tradeSchema = new mongoose.Schema({
	from : {
		team: String,
		players: [],
		player_names: [],
		picks: []
	},
	to: {
		team: String,
		players: [],
		player_names: [],
		picks: []
	},
	cash: [],
	status: String,
	deadline: Date
}, { collection: 'trades'});
var Trade = mongoose.model('trade', tradeSchema);
module.exports = Trade;