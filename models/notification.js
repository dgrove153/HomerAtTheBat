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

notificationSchema.statics.getOpenNotifications = function(req, res, next) {
	if(req.user) {
		Notification.find({team : req.user.team, dismissed: false }, function(err, notifications) {
			var tradeNotifications = 0;
			var freeAgentNotifications = 0;
			var vultureNotifications = 0;
			var globalNotifications = 0;
			notifications.forEach(function(n) {
				if(n.type === 'FREE_AGENT_AUCTION_STARTED') {
					freeAgentNotifications++;
				} else if(n.type === 'TRADE_PROPOSED') {
					tradeNotifications++;
				} else if(n.type === 'VULTURE') {
					vultureNotifications++;
				} else {
					globalNotifications++;
				}
			});
			if(tradeNotifications > 0) {
				res.locals.tradeNotifications = tradeNotifications;
			}
			if(freeAgentNotifications > 0) {
				res.locals.freeAgentNotifications = freeAgentNotifications;
			}
			if(vultureNotifications > 0) {
				res.locals.vultureNotifications = vultureNotifications;
			}
			if(globalNotifications > 0) {
				res.locals.globalNotifications = globalNotifications;
			}
			next();
		});
	} else {
		next();
	}
}

var Notification = mongoose.model('notifications', notificationSchema);
module.exports = Notification;