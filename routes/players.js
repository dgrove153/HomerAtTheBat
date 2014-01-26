var TEAM = require('../models/team');
var PLAYER = require('../models/player');

module.exports = function(app, passport){

	app.get("/player/:id", function(req, res) {
		PLAYER.findOne({_id : req.params.id}, function(err, player) {
			res.render("player", {
				title: player.name_display_first_last,
				player : player,
				user: req.user
			});
		})
	});

	app.get("/player", function(req, res) {
		PLAYER.find({}).sort({name_display_first_last : 1}).exec(function(err, players) {
			res.render("playerList", {
				title: 'Players',
				players: players
			});
		});
	});
}
