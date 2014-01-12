var PLAYER = require("../models/player");
var ADMIN = require("./admin");
var MAILER = require("../util/mailer");
var MLB = require("../external/mlb");
var ASYNC = require('async');
var CONFIG = require('../config/config');

var vultureHistoryYear = 1;

///////////////
//ROUTE ACTIONS
///////////////

exports.getVulturablePlayers = function(req, res, next) {
	var vulturablePlayers = [];
	PLAYER.find({}).sort({name_display_first_last:1,'history.1.fantasy_team':1}).exec(function(err, players) {
		players.forEach(function(player) {
			if(player.history[vultureHistoryYear] && player.history[vultureHistoryYear].fantasy_team && 
				player.history[vultureHistoryYear].fantasy_team != 'FA' &&
				player.status_code != player.fantasy_status_code && 
				!player.history[vultureHistoryYear].minor_leaguer &&
				(!player.vulture || !player.vulture.is_vultured)) {
				vulturablePlayers.push(player);
			}
		});
		res.locals.vulturablePlayers = vulturablePlayers;
		next();
	});
}

exports.getOpenVultures = function(req, res, next) {
	PLAYER.find({'vulture.is_vultured':true}, function(err, doc) {
		res.locals.openVultures = doc;
		next();
	});
};

exports.getVulturesForTeam = function(req, res, next) {
	PLAYER.find({fantasy_team: req.params.id, 'vulture.is_vultured':true}, function(err, doc) {
		res.locals.in_vultures = doc;
		PLAYER.find({'vulture.vulture_team':req.params.id, 'vulture.is_vultured':true}, function(err, doc) {
			res.locals.out_vultures = doc;
			next();
		})
	});
};

exports.getPlayerToVulture = function(req, res, next) {
	PLAYER.findOne({player_id:req.params.pid}, function(err, player) {
		res.locals.player = player;
		next();
	});
};

////////////////////
//VULTURE SUBMISSION
////////////////////

exports.submitVulture = function(vulture_pid, removing_pid, user, callback) {
	isVultureLegal(vulture_pid, removing_pid, function(isLegal, pid, message) {
		if(isLegal) {
			PLAYER.findOne({player_id: vulture_pid}, function(err, doc) {
				var vulture_player = doc;
				PLAYER.findOne({player_id: removing_pid}, function(err, doc) {
					var removing_player = doc;
					createVulture(vulture_player, removing_player, user, callback);
				});
			});			
		} else {
			if(pid == vulture_pid) {
				callback(message, "/team/" + user.team);
			} else {
				callback(message, "/gm/vulture/" + vulture_pid);
			}
		}
	});
};

////////////////////////
//VULTURE PRE-CONDITIONS
////////////////////////

var canPlayerBeVultured = function(player, callback) {
	var historyIndex = PLAYER.findHistoryIndex(player, 2013);
	if(player.vulture && player.vulture.is_vultured) {
		callback(false, player.name_display_first_last + " is already vultured");
	} else if(player.status_code != player.fantasy_status_code) {
		if(player.history[historyIndex].minor_leaguer) {
			callback(false, player.name_display_first_last + " is a minor leaguer and cannot be vultured");
		} else {
			callback(true);
		}
	} else {
		callback(false);
	}
}

var canPlayerBeUsedInVulture = function(player, callback) {
	if(player.vulture) {
		if(player.vulture.is_vultured) {
			return callback(false, player.name_display_first_last + " is being vultured, select a different player");
		} else if(player.vulture.vultured_for_pid) {
			return callback(false, player.name_display_first_last + " is already being used in a vulture");
		} else {
			return callback(true);
		}
	} else {
		return callback(true);
	}
}

var isPlayerVulturable = function(player_id, callback) {
	PLAYER.findOne({player_id:player_id}, function(err, player) {
		canPlayerBeVultured(player, callback);
	});
}

var isPlayerUsableInVulture = function(player_id, callback) {
	PLAYER.findOne({player_id:player_id}, function(err, player) {
		canPlayerBeUsedInVulture(player, callback);
	});
}

var isVultureLegal = function(vulture_pid, giving_up_pid, callback) {
	isPlayerVulturable(vulture_pid, function(isVulturable, message) {
		if(isVulturable) {
			isPlayerUsableInVulture(giving_up_pid, function(isUsable, message) {
				if(isUsable) {
					callback(true);
				} else {
					callback(false, giving_up_pid, message);
				}
			});
		} else {
			callback(false, vulture_pid, message);
		}
	});
}

exports.isVultureLegal = isVultureLegal;

//////////////////
//VULTURE CREATION
//////////////////

var setAsVultured = function(player, user) {
	player.vulture.is_vultured = true;
	player.vulture.vulture_team = user.team;
	var deadline = new Date();
	player.vulture.deadline = deadline.setDate(deadline.getDate() + 1);
}

var createVulture = function(vulture_player, drop_player, user, callback) {
	setAsVultured(vulture_player, user);
	drop_player.vulture.vultured_for_pid = vulture_player.player_id;
	ASYNC.series([
		function(cb) {
			vulture_player.save(function() {
				cb();
			});
		}, function(cb) {
			drop_player.save(function() {
				cb();
			});
		}, function(cb) {
			MAILER.sendMail({ 
				from: 'Homer Batsman',
				to: 'arigolub@gmail.com',
				subject: vulture_player.name_display_first_last + " has been vultured",
				text: vulture_player.vulture.vulture_team + " is trying to vulture " + vulture_player.name_display_first_last + ". " +
					vulture_player.history[vultureHistoryYear].fantasy_team + " has until " + vulture_player.vulture.deadline + " to fix it."
			});
			callback("Vulture successful. Deadline is " + vulture_player.vulture.deadline + ".", 
				"/team/" + vulture_player.history[vultureHistoryYear].fantasy_team);
			cb();
	}]);
};

/////////////////
//VULTURE REMOVAL
/////////////////

var removeVulture = function(player, callback) {
	player.vulture = undefined;
	ASYNC.series([
		function(cb) {
			player.save(function() {
				cb();
			});
		}, function(cb) {
			PLAYER.findOne({'vulture.vultured_for_pid':player.player_id}, function(err, givingUpPlayer) {
				if(givingUpPlayer) {
					givingUpPlayer.vulture.vultured_for_pid = undefined;
					givingUpPlayer.save(function() {
						cb();
					});
				} else {
					cb();
				}
			});
		}
	], function() {
		callback("Vulture removed");
	});
}

exports.removeVulture = function(pid, callback) {
	PLAYER.findOne({player_id:pid}, function(err, player) {
		removeVulture(player, callback);
	});
};

////////////////
//VULTURE FIXING
////////////////

exports.updateStatusAndCheckVulture = function(player_id, callback) {
	MLB.getMLBProperties(player_id, function(mlbPlayer) {
		PLAYER.updatePlayer_MLB(mlbPlayer, function(player) {
			ADMIN.updateESPN(player.espn_player_id, function(player) {
				if(player.status_code == player.fantasy_status_code) {
					removeVulture(player, callback);
					player.save();
				} else {
					callback(false, player.status_code, player.fantasy_status_code);
				}
			});
		});
	});
};