var HELPERS = require('./helpers');
var PLAYER = require("../../models/player");
var CONFIG = require("../../config/config").config();
var ASYNC = require('async');
var MAILER = require("../../util/mailer");
var TEAM = require("../../models/team");

var sendSuccessMail = function(vulturePlayer, dropPlayer) {
	vulturePlayer.history_index = PLAYER.findHistoryIndex(vulturePlayer, CONFIG.year);
	dropPlayer.history_index = PLAYER.findHistoryIndex(dropPlayer, CONFIG.year);
	var vultureHistory = vulturePlayer.history[vulturePlayer.history_index];
	var dropHistory = dropPlayer.history[dropPlayer.history_index];
	TEAM.findOne({ teamId : vultureHistory.fantasy_team }, function(err, vulturePlayerTeam) {
		var emailTo = [ 
			vulturePlayerTeam.teamId, 
			dropHistory.fantasy_team
		];
		var html = "<h3>Successful Vulture!</h3><p>" + vulturePlayerTeam.fullName + " has vultured " + vulturePlayer.name_display_first_last + " and has dropped " +
			dropPlayer.name_display_first_last + ". This will be reflected on the ESPN website shortly.</p>"; 
		MAILER.sendMail({ 
			from: 'Homer Batsman',
			to: emailTo,
			subject: vulturePlayer.name_display_first_last + " has been successfully vultured",
			html: html
		});
	});
}

var doSuccessfulVultureAddDrops = function(vultureId) {
	PLAYER.findOne({ _id : vultureId }, function(err, vp) {
		PLAYER.updatePlayerTeam(vp, vp.vulture.vulture_team, CONFIG.year, function() {
			PLAYER.findOne({ 'vulture.vultured_for_id' : vultureId }, function(err, dp) {
				PLAYER.updatePlayerTeam(dp, 0, CONFIG.year, function() {
					HELPERS.removeVulture(vp, function() {	
						sendSuccessMail(vp, dp);
					});
				})
			});
		});
	});
}

var doFixedVultureAddDrops = function(vultureId) {
	PLAYER.findOne({ _id : vultureId }, function(err, player) {
		HELPERS.removeVulture(player);
	});
}

var doVultureExpiration = function(vultureId, io, user, callback) {
	HELPERS.updateStatusAndCheckVulture(vultureId, function(vultureFixed, statusCode, fantasyStatusCode) {
		var message;
		if(vultureFixed) {
			doFixedVultureAddDrops(vultureId);
			message = "Statuses match, vulture removed!";
		} else {
			doSuccessfulVultureAddDrops(vultureId);	
			message = "The player is still vulturable. MLB Status: " + statusCode + " and Fantasy Status: " + 
				fantasyStatusCode + " do not match. Vulture successful!";
		}
		if(io) {
			io.sockets.in(user.team).emit('message', { 
				player: vultureId, 
				message: message
			});
		}
		if(callback) {
			callback();
		}
	}, io, user);
}

var doVultureFixAttempt = function(vultureId, io, user, callback) {
	HELPERS.updateStatusAndCheckVulture(vultureId, function(vultureFixed, statusCode, fantasyStatusCode) {
		var message;
		if(vultureFixed) {
			doFixedVultureAddDrops(vultureId);
			message = "Statuses match, vulture removed!";
		} else {
			message = "Sorry, the player is still vulturable. MLB Status: " + statusCode + " and Fantasy Status: " + 
				fantasyStatusCode + " do not match.";
		}
		if(io) {
			io.sockets.in(user.team).emit('message', { 
				player: vultureId, 
				message: message
			});
		}
		if(callback) {
			callback();
		}
	}, io, user);
};

module.exports = {
	doVultureExpiration : doVultureExpiration,
	doVultureFixAttempt : doVultureFixAttempt
}