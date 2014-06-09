var CONFIG = require('../config/config').config();
var NUMERAL = require('numeral');
var PLAYER = require('../models/player');
var PLAYERMOVE = require("../application/player/move");
var PLAYERSEARCH = require("../application/player/search");
var PLAYERSORT = require('../application/player/sort');
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

	app.post("/player/sendToMinorLeagues", function(req, res) {
		var id = req.body._id;
		var team = req.body.team;
		PLAYERMOVE.sendToMinorLeagues(id, function(player, message) {
			if(!player) {
				req.flash('message', { isSuccess : false, message: message})
			} else {
				req.flash('message', { isSuccess : true, message : message})
			}
			res.redirect('/team/' + team);
		})
	});

	app.post("/player/do/:id", function(req, res) {
		var _id = req.params.id;
		var body = req.body;
		var action = body.action;
		var returnUrl = body.returnUrl;
		if(action == "REMOVE_MINORS_DESIGNATION") {
			PLAYER.removeMinorLeagueStatus(_id, function(message) {
				req.flash('message', { isSuccess : true, message : message })
				res.redirect(returnUrl);
			});
		} else {
			res.send("unknown action: " + action);
		}
	});
}
