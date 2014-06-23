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

	app.post("/player/do/:id", function(req, res) {
		var _id = req.params.id;
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
		} else {
			res.send("unknown action: " + action);
		}
	});
}
