var mongoose = require("mongoose");
var CONFIG = require("../config/config");
var ASYNC = require('async');

var notificationSchema = new mongoose.Schema({
	type: String,
	date: Date,
	player_name: String,
	team: Number,
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

var createSingle = function(type, player_name, team, message) {
	var notification = new Notification();
	notification.type = type;
	notification.date = new Date();
	notification.player_name = player_name;
	notification.message = message;
	notification.team = team;
	notification.save();
}

notificationSchema.statics.createNew = function(type, player_name, team, message, callback, teams) {
	if(team == 'ALL') {
		teams.forEach(function(team) {
			createSingle(type, player_name, team.teamId, message);
		});
	} else {
		createSingle(type, player_name, team, message);
	}
	if(callback) {
		callback();
	}
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

notificationSchema.statics.dismissAllByType = function(teamId, type, callback) {
	Notification.find({ team : teamId, type : type }, function(err, notifications) {
		ASYNC.forEachSeries(notifications, function(n, cb) {
			n.dismissed = true;
			n.save(function() {
				cb();
			});
		}, function() {
			callback();
		})
	});
}

///////////////////////
//NOTIFICATIONS BY TYPE
///////////////////////

notificationSchema.statics.getTradeNotifications = function(req, res, next) {
	if(req.user) {
		Notification.find({team : req.user.team, dismissed: false, type : "TRADE_PROPOSED"}, function(err, notifications) {
			if(notifications.length > 0) {
				res.locals.tradeNotifications = notifications.length;
			}
			next();
		});
	} else {
		next();
	}
}

var Notification = mongoose.model('notifications', notificationSchema);
module.exports = Notification;