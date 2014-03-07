var FREEAGENTAUCTION = require('../../models/freeAgentAuction');

exports.makeBid = function(_id, bid, teamId, callback) {
	FREEAGENTAUCTION.findOne({ _id : _id }, function(err, data) {
		var curDate = new Date();
		if(!data) {
			callback(false, "There is no player to bid on.");
		}
		if(!data.active) {
			callback(false, "This auction is not currently active.");
		}
		if(curDate > data.deadline) {
			callback(false, "The deadline for this auction has passed.");
		}
		var existingBid = false;
		for(var i = 0; i < data.bids.length; i++) {
			if(data.bids[i].teamId == teamId) {
				existingBid = true;
				data.bids[i].amount = bid;
			}
		}
		if(!existingBid) {
			data.bids.push( { teamId : teamId, amount : bid } );
		}
		data.save();
		callback(true, "You successfully bid " + bid + " dollars.");
	});
};