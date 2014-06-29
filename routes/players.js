var CONFIG = require('../config/config').config();
var NUMERAL = require('numeral');
var PLAYER = require('../models/player');
var PLAYER_MINORLEAGUER = require("../application/player/minorLeaguer");
var PLAYERSEARCH = require("../application/player/search");
var TEAM = require('../models/team');

module.exports = function(app, passport){

	app.get("/player/:id", function(req, res) {
		var config = CONFIG;
		PLAYER.findOne({_id : req.params.id}, function(err, player) {
			res.render("player", {
				config : config,
				isHitter : player.primary_position != 1,
				title: player.name_display_first_last,
				player : player,
				user: req.user,
				numeral : NUMERAL
			});
		})
	});

	app.get("/player", function(req, res) {
		PLAYERSEARCH.findPlayersMissingESPNIds(function(playersMissingESPN) {
			var isAdmin = req.user ? req.user.role == 'admin' : false;
			res.render("playerList", {
				isAdmin: isAdmin,
				title: 'Players',
				playersMissingESPN : playersMissingESPN
			});
		});
	});

	app.post("/player/do", function(req, res) {
		var _id = req.query['id'];
		var body = req.body;
		var action = body.action;
		var returnUrl = body.returnUrl;
		if(action == "PROMOTE_TO_ACTIVE") {
			PLAYER_MINORLEAGUER.promoteToActiveRoster(_id, function(isSuccess, message) {
				req.flash('message', { isSuccess : isSuccess, message : message })
				res.redirect(returnUrl);
			});
		} else if(action == "DEMOTE_TO_MINORS") {
			PLAYER_MINORLEAGUER.demoteToMinorLeagueRoster(_id, function(isSuccess, message) {
				req.flash('message', { isSuccess : isSuccess, message : message })
				res.redirect(returnUrl);
			});
		} else if(action == "CHANGE_TRADE_LEVEL") {
			var tradeLevel = req.body.tradeLevel;
			PLAYER.updateProperty(_id, "tradeLevel", tradeLevel, function(isSuccess, failMessage) {
				var message = failMessage ? failMessage : "Trade level successfully changed";
				req.flash('message', { isSuccess : isSuccess, message : message });
				res.redirect(returnUrl);
			});
		} else if(action == "DROP") {
			PLAYER.findOne({_id : _id}, function(err, dbPlayer) {
				if(err || !dbPlayer) {
					req.flash('message', { isSuccess : false, message : "Could not find the player" });
					res.redirect(returnUrl);
				} else {
					dbPlayer.updatePlayerTeam(0, CONFIG.year, function() {
						req.flash('message', { isSuccess : true, message : "Successfully dropped " + dbPlayer.name_display_first_last });
						res.redirect(returnUrl);
					});
				}
			});
		} else {
			res.send("unknown action: " + action);
		}
	});
}
