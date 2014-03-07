var mongoose = require("mongoose");

var freeAgentAuctionSchema = new mongoose.Schema({
	player_name: String,
	player_id: Number,
	active: Boolean,
	deadline: Date, 
	bids: [{
		teamId: Number,
		amount: Number
	}]
}, { collection: 'freeAgentAuction'});

freeAgentAuctionSchema.statics.createNew = function(player_id, player_name, deadline, active) {
	var faa = new FreeAgentAuction();
	faa.player_id = player_id;
	faa.player_name = player_name;
	faa.deadline = deadline;
	faa.active = true;
	faa.save();
	console.log('saved');
}

var FreeAgentAuction = mongoose.model('freeAgentAuction', freeAgentAuctionSchema);
module.exports = FreeAgentAuction;