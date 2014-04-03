var ASYNC = require('async');
var CONFIG = require("../../config/config").config();
var HELPERS = require("./helpers");
var PLAYER = require("../../models/player");

///////////////
//ROUTE ACTIONS
///////////////

exports.getVulturablePlayers = function(req, res, next) {
	var leagueVulturablePlayers = [];
	var userVulturablePlayers = [];
	PLAYER.find({}).sort({name_last:1}).exec(function(err, players) {
		players.forEach(function(player) {
			HELPERS.canPlayerBeVultured(player, function(canBeVultured) {
				if(canBeVultured) {
					var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
					if(player.history[historyIndex].fantasy_team == req.user.team) {
						userVulturablePlayers.push(player);
					} else {
						leagueVulturablePlayers.push(player);
					}
				}
			})
		});
		res.locals.userVulturablePlayers = userVulturablePlayers;
		res.locals.leagueVulturablePlayers = leagueVulturablePlayers;
		next();
	});
}

exports.getOpenVultures = function(req, res, next) {
	PLAYER.find({'vulture.is_vultured':true}, function(err, players) {
		ASYNC.forEachSeries(players, function(p, cb) {
			PLAYER.findOne({ 'vulture.vultured_for_id' : p._id }, function(err, dPlayer) {
				p.vulture.vultured_for_player = dPlayer;
				cb();
			});
		}, function() {
			res.locals.openVultures = players;
			next();
		});
	});
};

exports.getVulturesForTeam = function(req, res, next) {
	var teamId = parseInt(req.params.id);
	PLAYER.find({'history.0.fantasy_team': teamId, 'vulture.is_vultured':true}, function(err, in_vultures) {
		PLAYER.find({'vulture.vulture_team':teamId, 'vulture.is_vultured':true}, function(err, out_vultures) {
			ASYNC.series([
				function(cb) {
					ASYNC.forEachSeries(out_vultures, function(vulture, _cb) {
						PLAYER.findOne({ 'vulture.vultured_for_id' : vulture._id }, function(err, player) {
							vulture.givingUpPlayer = player;
							_cb();
						});
					}, function() {
						cb();
					});
				}
			], function() {
				res.locals.in_vultures = in_vultures;
				res.locals.out_vultures = out_vultures;
				next();
			});
		})
	});
};

exports.getPlayerToVulture = function(req, res, next) {
	PLAYER.findOne({_id:req.params.pid}, function(err, player) {
		res.locals.player = player;
		next();
	});
};