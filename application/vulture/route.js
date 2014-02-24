var PLAYER = require("../../models/player");
var HELPERS = require("./helpers");
var ASYNC = require('async');

///////////////
//ROUTE ACTIONS
///////////////

exports.getVulturablePlayers = function(req, res, next) {
	var vulturablePlayers = [];
	PLAYER.find({}).sort({name_display_first_last:1}).exec(function(err, players) {
		players.forEach(function(player) {
			HELPERS.canPlayerBeVultured(player, function(canBeVultured) {
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