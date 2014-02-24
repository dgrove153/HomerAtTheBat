var HELPERS = require('./helpers');
var PLAYER = require("../../models/player");
var CONFIG = require("../../config/config").config();
var ASYNC = require('async');
var MAILER = require("../../util/mailer");
var TEAM = require("../../models/team");

var removeVulture = function(player, callback) {
	player.vulture = undefined;
	ASYNC.series([
		function(cb) {
			player.save(function() {
				cb();
			});
		}, function(cb) {
			PLAYER.findOne({ 'vulture.vultured_for_id' : player._id }, function(err, givingUpPlayer) {
				if(givingUpPlayer) {
					givingUpPlayer.vulture.vultured_for_id = undefined;
					givingUpPlayer.save(function() {
						cb();
					});
				} else {
					cb();
				}
			});
		}
	], function() {
		callback();
	});
}

var sendSuccessMail = function(vulturePlayer, dropPlayer) {
	var vultureHistory = vulturePlayer.history[vulturePlayer.history_index];
	var dropHistory = dropPlayer.history[dropPlayer.history_index];
	TEAM.findOne({ teamId : vultureHistory.fantasy_team }, function(err, vulturePlayerTeam) {
		var emailTo = [ 
			vulturePlayerTeam.teamId, 
			dropHistory.fantasy_team
		];
		var html = vulturePlayerTeam.fullName + " has vultured " + vulturePlayer.name_display_first_last + " and has dropped " +
			dropPlayer.name_display_first_last + ". This will be reflected on the ESPN website shortly."; 
		MAILER.sendMail({ 
			from: 'Homer Batsman',
			to: emailTo,
			subject: vulturePlayer.name_display_first_last + " has been successfully vultured",
			html: html
		});
	});
}


var handleVultureExpiration = function(vultureId, dropId) {
	HELPERS.updateStatusAndCheckVulture(vultureId, function(isFixed) {
		if(!isFixed) {
			PLAYER.findOne({ _id : vultureId }, function(err, vp) {
				PLAYER.updatePlayerTeam(vp, vp.vulture.vulture_team, CONFIG.year, function() {
					removeVulture(vp, function() {	
						PLAYER.findOne({ _id : dropId }, function(err, dp) {
							PLAYER.updatePlayerTeam(dp, 0, CONFIG.year, function() {
								sendSuccessMail(vp, dp);
							});
						})
					});
				});
			});
		}
	});
}

module.exports = {
	handleVultureExpiration : handleVultureExpiration,
	removeVulture : removeVulture
}