var PLAYER = require("../models/player");
var MAILER = require("../util/mailer");
var MLB = require("../external/mlb");
var ASYNC = require('async');
var CONFIG = require('../config/config');
var ESPN = require('../external/espn');
var UTIL = require('../application/util');
var SCHEDULE = require('node-schedule');

var vultureHistoryYear = 0;

///////////////
//ROUTE ACTIONS
///////////////

exports.getVulturablePlayers = function(req, res, next) {
	var vulturablePlayers = [];
	PLAYER.find({}).sort({name_display_first_last:1,fantasy_team:1}).exec(function(err, players) {
		players.forEach(function(player) {
			canPlayerBeVultured(player, function(canBeVultured) {
				if(canBeVultured) {
					vulturablePlayers.push(player);
				}
			})
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
	var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
	if(player.history[historyIndex] && player.history[historyIndex].fantasy_team 
		&& player.history[historyIndex].fantasy_team != 'FA') {
		if(player.vulture && player.vulture.is_vultured) {
			callback(false, player.name_display_first_last + " is already vultured");
		} else if(player.status_code != player.fantasy_status_code) {
			if(player.history[historyIndex].minor_leaguer) {
				var isHitter = player.primary_position != 1;
				if(!isHitter) {
					if(player.innings_pitched && player.innings_pitched >= CONFIG.minorLeaguerInningsPitchedThreshhold) {
						callback(true);
					} else {
						callback(false, player.name_display_first_last + " has not thrown enough innings to be vulturable");
					}
				} else {
					if(player.at_bats && player.at_bats >= CONFIG.minorLeaguerAtBatsThreshhold) {
						callback(true);
					} else {
						callback(false, player.name_display_first_last + " has not had enough at bats to be vulturable");
					}
				}
				callback(false, player.name_display_first_last + " is a minor leaguer and cannot be vultured");
			} else {
				callback(true);
			}
		} else {
			callback(false);
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
	var deadline = new Date(new Date().getTime() + 1*60000);
	player.vulture.deadline = deadline;
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
			SCHEDULE.scheduleJob(vulture_player.vulture.deadline, function() {
				PLAYER.findOne({player_id : vulture_player.player_id}, function(err, dbPlayer) {
					if(dbPlayer.vulture && dbPlayer.vulture.is_vultured) {
						handleVultureExpiration(vulture_player.player_id, drop_player.player_id);
					}
				});
			});
			callback("Vulture successful. Deadline is " + vulture_player.vulture.deadline + ".", 
				"/gm/vulture");
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
		callback(true, player.status_code, player.fantasy_status_code);
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

var updateStatusAndCheckVulture = function(player_id, callback) {
	MLB.getMLBProperties(player_id, function(mlbPlayer) {
		PLAYER.updatePlayer_MLB(mlbPlayer, function(player) {
			var dbPlayer = player;
			ESPN.updateESPN_LeaguePage(player.espn_player_id, function(id, name, position) {
				var fantasy_status_code = UTIL.positionToStatus(position);
				dbPlayer.fantasy_status_code = fantasy_status_code;
				if(dbPlayer.status_code == dbPlayer.fantasy_status_code) {
					removeVulture(dbPlayer, callback);
					dbPlayer.save();
				} else {
					callback(false, dbPlayer.status_code, dbPlayer.fantasy_status_code);
				}
			});
		});
	});
};

exports.updateStatusAndCheckVulture = updateStatusAndCheckVulture;

var handleVultureExpiration = function(vulturePlayerId, dropPlayerId) {
	updateStatusAndCheckVulture(vulturePlayerId, function(isFixed) {
		if(!isFixed) {
			PLAYER.findOne({player_id : vulturePlayerId}, function(err, vp) {
				PLAYER.updatePlayerTeam(vp, vp.vulture.vulture_team, CONFIG.year, function() {
					removeVulture(vp, function() {	
						PLAYER.findOne({player_id : dropPlayerId}, function(err, dp) {
							PLAYER.updatePlayerTeam(dp, 'FA', CONFIG.year, function() {
								MAILER.sendMail({ 
									from: 'Homer Batsman',
									to: 'arigolub@gmail.com',
									subject: vp.name_display_first_last + " has been successfully vultured",
									text: vp.fantasy_team + " has vultured " + vp.name_display_first_last + " and has dropped" +
									dp.name_display_first_last + ". This will be reflected on the website shortly."
								});
							});
						})
					});
				});
			});
		}
	});

}