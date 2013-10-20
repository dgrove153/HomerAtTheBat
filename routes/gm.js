var Team = require('../models/team');
var Vulture = require("../application/vulture");

module.exports = function(app, passport){

	app.get("/gm/vulture/:pid", Vulture.preprocessVulture, Team.getActiveRoster, function( req, res) {
		res.render('vulture', { 
			allowVulture: req.allowVulture, 
			player: req.player, 
			playerList: req.playerList,
			user: req.user, 
		});
	});

	app.post("/gm/vulture/:pid", Vulture.submitVulture, function(req, res) {
		res.send(req.message);
	});
}
