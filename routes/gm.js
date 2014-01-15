var PLAYER = require('../models/player');

module.exports = function(app, passport){
	
	////////
	//LOCKUP
	////////

	app.get("/gm/lockup/:pid", function(req, res) {
		PLAYER.lockUpPlayer(req.params.pid, function(message) {
			console.log(message);
			res.redirect("/");
		});	
	});
}
