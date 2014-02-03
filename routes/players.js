var TEAM = require('../models/team');
var PLAYER = require('../models/player');

module.exports = function(app, passport){

	app.get("/player/:id", function(req, res) {
		PLAYER.findOne({_id : req.params.id}, function(err, player) {
			res.render("player", {
				isHitter : player.primary_position != 1,
				title: player.name_display_first_last,
				player : player,
				user: req.user
			});
		})
	});

	app.get("/player", function(req, res) {
		PLAYER.find({}, function(err, players) {
			players.sort(function(a,b) {
				var lastA = a.name_display_first_last.split(' ')[a.name_display_first_last.split(' ').length - 1];
				var lastB = b.name_display_first_last.split(' ')[b.name_display_first_last.split(' ').length - 1];
				if(!lastA || !lastB) {
					return -1;
				}
				if(lastA < lastB) {
					return -1;
				} else if(lastB < lastA) {
					return 1;
				} else {
					return -1;
				}
			});
			res.render("playerList", {
				title: 'Players',
				players: players
			});
		});
	});

	app.get("/player/update/stats", function(res, res) {
		PLAYER.updateStats(true, function() {
			res.send('updating');
		});
	});
}
