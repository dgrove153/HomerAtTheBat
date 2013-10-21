var Team = require('../models/team');
var Player = require('../models/player');

module.exports = function(app, passport){

	app.get("/services/lockup/:pid/:year", function(req, res) {
		Player.lockUpPlayer(req.params.pid, req.params.year);	
		res.send('got it');
	});

}
