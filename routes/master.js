var TEAM = require('../models/team');
var PLAYER = require('../models/player');
var NOTIFICATION = require('../models/notification');

module.exports = function(app, passport){
	app.get("/", TEAM.getList, NOTIFICATION.getNotificationsForTeam, function(req, res){ 
		PLAYER.find({}).sort({name_display_first_last:1}).exec(function(err, players) {
			if(req.isAuthenticated()){
				res.render("home", { 
					session: req.session, title: 'Homer At The Bat',
					players: players
				}); 
			}else{
				res.render("home", { 
					session: req.session, title: 'Homer At The Bat',
					players: players
				});
			}
		});
	});

	app.get("/player/:id", function(req, res) {
		PLAYER.findOne({_id : req.params.id}, function(err, player) {
			res.render("player", {
				title: player.name_display_first_last,
				player : player
			});
		})
	});
}
