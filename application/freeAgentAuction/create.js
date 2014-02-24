var ASYNC = require('async');
var CONFIG = require('../../config/config').config();
var FREEAGENTAUCTION = require('../../models/freeAgentAuction');
var FAA_END = require('./endAuction');
var MAILER = require('../../util/mailer')
var MOMENT = require('moment');
var NOTIFICATION = require('../../models/notification');
var PLAYER = require('../../models/player');
var PLAYERMLB = require("../../application/player/update/mlb");
var TEAM = require("../../models/team");

exports.requestNew = function(name, requestingTeam, callback) {
	TEAM.findOne({ teamId : requestingTeam }, function(err, team) {
		var message = team.fullName + " is requesting to start a free agent auction for " + name;
		NOTIFICATION.createNew('FREE_AGENT_AUCTION_REQUEST', name, 1, message);
		MAILER.sendMail({ 
			from: 'Homer Batsman',
			to: [1],
			subject: "Free Agent Auction Request",
			text: message
		}); 
		callback("The Commisioner has been notified of your request");
	});
};

var sendMail = function(player, deadline) {
	MAILER.sendMail({ 
		from: 'Homer Batsman',
		to: [1],
		subject: "New Free Agent Auction!",
		html: "<h3>New Free Agent Auction</h3><h1>" + player.name_display_first_last + 
			"</h1><p>The deadline for the auction is " + 
			MOMENT(deadline).format('MMMM Do YYYY, h:mm a [EST]') + 
			". To bid, <a href='http://homeratthebat.herokuapp.com/gm/faa'>click here</a>."
	}); 
}

var createNotifications = function(player, teams) {
	var message = "New Free Agent Auction: " + player.name_display_first_last
	NOTIFICATION.createNew('FREE_AGENT_AUCTION_STARTED', player.name_display_first_last, 'ALL', message, 
		function() {}, teams);
}

exports.createNew = function(player_id, teams, callback) {
	FREEAGENTAUCTION.findOne( { player_id : player_id }, function(err, data) {
		if(data && data.active) {
			callback("There is already an auction for this player");
		} else {
			var player;
			ASYNC.series([
				function(cb) {
					PLAYER.findOne({player_id : player_id}, function(err, dbPlayer) {
						if(!dbPlayer) {
							var history = [{
								year : CONFIG.year,
								salary : 3,
								contract_year : 0,
								minor_leaguer : false
							}];
							PLAYERMLB.createPlayerWithMLBId(player_id, null, null, history, function(newPlayer) {
								player = newPlayer;
								cb();
							});
						} else {
							player = dbPlayer;
							cb();
						}
					});
				}, function(cb) {
					var deadline = MOMENT().add('seconds', 60);
					
					FREEAGENTAUCTION.createNew(player.player_id, player.name_display_first_last, deadline, true);
					
					sendMail(player, deadline);
					createNotifications(player, teams);
					FAA_END.scheduleExpiration(player, deadline);

					callback("Free Agent Auction for " + player.name_display_first_last + " created");	
					cb();
				}
			]);
		}
	});
};