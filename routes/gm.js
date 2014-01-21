var PLAYER = require('../models/player');
var CONFIG = require('../config/config');

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

	///////////////
	//MINOR LEAGUER
	///////////////

	app.post("/gm/minorLeaguer/remove", function(req, res) {
		var payload = req.body;
		var player;
		PLAYER.findOne({player_id : payload.player_id}, function(err, dbPlayer) {
			if(!dbPlayer) {
				PLAYER.findOne({name_display_first_last : payload.player_name}, function(err, dbPlayer) {
					if(!dbPlayer) {
						res.send({ result: false, message: "Couldn't locate the minor leaguer. Please e-mail Ari with this issue" });
					} else {
						player = dbPlayer;
						PLAYER.updatePlayerTeam(player, 'FA', CONFIG.year, function() {
							res.send({ result: true })
						});
					}
				});
			} else {
				player = dbPlayer;
				PLAYER.updatePlayerTeam(player, 'FA', CONFIG.year, function() {
					res.send({ result: true })
				});
			}
		})
	});
}
