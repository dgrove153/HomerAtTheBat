var TEAM = require('../models/team');
var PLAYER = require('../models/player');
var PLAYERSORT = require('../application/player/sort');
var CONFIG = require('../config/config').config();

module.exports = function(app, passport){

	app.get("/player/:id", function(req, res) {
		var config = CONFIG;
		PLAYER.findOne({_id : req.params.id}, function(err, player) {
			res.render("player", {
				config : config,
				isHitter : player.primary_position != 1,
				title: player.name_display_first_last,
				player : player,
				user: req.user
			});
		})
	});

	app.get("/player", function(req, res) {
		PLAYERSORT.sortByLastName(function(players) {
			var isAdmin = req.user ? req.user.role == 'admin' : false;
			res.render("playerList", {
				isAdmin: isAdmin,
				title: 'Players',
				players: players
			});
		});
	});
}
