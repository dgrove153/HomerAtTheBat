var PLAYER = require('../models/player');
var CONFIG = require('../config/config');

module.exports = function(app, passport){
	
	////////
	//LOCKUP
	////////

	app.post("/gm/lockup", function(req, res) {
		PLAYER.lockUpPlayer(req.body.player_id, req.body.salary, function(player, message) {
			req.flash('message', message);
			res.redirect("/gm/keepers/" + player.fantasy_team);
		});	
	});

	app.post("/gm/lockup/remove", function(req, res) {
		PLAYER.lockUpPlayer_Remove(req.body.player_id, function(player, message) {
			req.flash('message', message);
			res.redirect("/gm/keepers/" + player.fantasy_team);
		});
	})

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
