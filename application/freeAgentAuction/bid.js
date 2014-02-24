var FREEAGENTAUCTION = require('../../models/freeAgentAuction');

exports.makeBid = function(_id, bid, teamId, callback) {
	FREEAGENTAUCTION.findOne({ _id : _id }, function(err, data) {
		var curDate = new Date();
		if(!data) {
			callback("No such player");
		}
		if(!data.active) {
			callback("This is not an active auction");
		}
		if(curDate > data.deadline) {
			callback("deadline has passed");
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
		callback("Bid successful");
	});
};