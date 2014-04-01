var PLAYERSORT = require('../application/player/sort');
var NOTIFICATION = require('../models/notification');
var SCHEDULE = require("../application/schedule");

module.exports = function(app, passport){
	app.get("/", NOTIFICATION.getNotificationsForTeam, SCHEDULE.getSchedule, function(req, res){ 
		if(req.isAuthenticated()){
			res.render("home", { 
				session: req.session, title: 'Homer At The Bat'
			}); 
		}else{
			res.render("home", { 
				session: req.session, title: 'Homer At The Bat'
			});
		}
	});
}
