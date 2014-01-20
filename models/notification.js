var mongoose = require("mongoose");
var CONFIG = require("../config/config");

var notificationSchema = new mongoose.Schema({
	type: String,
	date: Date,
	player_name: String,
	team: String,
	message: String,
	dismissed: { type: Boolean, default: false} 
}, { collection: 'notifications'});

/////////////////
//ROUTE FUNCTIONS
/////////////////

notificationSchema.statics.getNotificationsForTeam = function(req, res, next) {
	if(req.user) {
		Notification.find({team : req.user.team, dismissed: false}).sort({date: -1}).exec(function(err, notifications) {
			res.locals.notifications = notifications;
			next();
		})
	} else {
		next();
	}
}

////////
//CREATE
////////

notificationSchema.statics.createNew = function(type, player_name, team, message, callback) {
	var notification = new Notification();
	notification.type = type;
	notification.date = new Date();
	notification.player_name = player_name;
	notification.team = team;
	notification.message = message;
	notification.save(function() {
		callback();
	});
}

/////////
//DISMISS
/////////

notificationSchema.statics.dismiss = function(id) {
	Notification.findOne({_id : id}, function(err, notification) {
		notification.dismissed = true;
		notification.save();
	})
}

var Notification = mongoose.model('notifications', notificationSchema);
module.exports = Notification;