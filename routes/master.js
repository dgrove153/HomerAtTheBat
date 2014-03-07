var NOTIFICATION = require('../models/notification');
var PLAYERSORT = require('../application/player/sort');

module.exports = function(app, passport){
	app.get("/", NOTIFICATION.getNotificationsForTeam, function(req, res){ 
		PLAYERSORT.sortByLastName(function(players) {
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
}
