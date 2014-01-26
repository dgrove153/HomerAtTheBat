var PLAYER = require('../models/player');

module.exports = function(app, passport){

	///////
	//API
	///////

	app.post("/api/players", function(req, res) {
		PLAYER.find({}).sort({name_display_first_last: 1}).exec(function(err, players) {
			res.send(players);
		});
	});
}
