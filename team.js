var mongoose = require("mongoose");
var schema = require("./schema");

exports.findById = function(req, res) {
	var id = req.params.id;
	var findQuery = { team : id };
	var playerList;
	schema.Player.find(findQuery).sort({minorLeaguer: 1, salary2013:-1}).exec(function(err, doc) {
		playerList = doc;	
		for(var i = 0; i < playerList.length; i++) {
			var pl = playerList[i];
			pl.salary2014 = pl.salary2013 + 3;
		}
		res.render('team.jade', { players: playerList});
	});
};
