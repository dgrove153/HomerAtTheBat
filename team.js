var mongoose = require("mongoose");

module.exports = function(req, res, next) {
	var id = req.params.id;
	var findQuery = { team : id };
	var playerList;
	var Player = mongoose.model('Player');
	Player.find(findQuery).sort({history.0.minorLeaguer: 1, history.0.salary:-1}).exec(function(err, doc) {
		playerList = doc;	
		for(var i = 0; i < playerList.length; i++) {
			var pl = playerList[i];
			pl.salary2014 = pl.salary2013 + 3;
		}
		req.players = playerList;
		next();
	});
};
