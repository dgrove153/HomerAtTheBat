var APP = require('../application/app');
var NUMERAL = require('numeral');
var PLAYER = require('../models/player');
var PLAYERSEARCH = require("../application/player/search");
var SCHEDULE = require('../application/schedule');
var WATCHLIST = require('../models/watchlist');

module.exports = function(app, passport){

	///////
	//API
	///////

	app.post("/api/players", function(req, res) {
		PLAYER.find({}).sort({ name_last : 1, name_first : 1 }).exec(function(err, players) {
			res.render("partials/playerList", {
				players: players
			});
		});
	});

	app.get("/api/players/freeAgents", function(req, res) {
		PLAYERSEARCH.findFreeAgents(function(batters, pitchers) {
			var batterHtml;
			var pitcherHtml;
			res.render("partials/freeAgentTable", {
				isHitter : true,
				dbPlayers : batters,
				numeral : NUMERAL
			}, function(err, html) {
				batterHtml = html;
				res.render("partials/freeAgentTable", {
					isHitter : false,
					dbPlayers : pitchers,
					numeral : NUMERAL
				}, function(err, html) {
					pitcherHtml = html;
					res.send({ batterHtml : batterHtml, pitcherHtml : pitcherHtml });
				});
			});
		});
	});

	app.post("/api/players/filtered/name", function(req, res) {
		var text = req.body.text;
		var search = { name_display_first_last : new RegExp(text,"i") };
		PLAYER.find(search, function(err, players) {
			players.sort(function(a,b) {
				var lastA = a.name_display_first_last.split(' ')[a.name_display_first_last.split(' ').length - 1];
				var lastB = b.name_display_first_last.split(' ')[b.name_display_first_last.split(' ').length - 1];
				if(!lastA || !lastB) {
					return -1;
				}
				if(lastA < lastB) {
					return -1;
				} else if(lastB < lastA) {
					return 1;
				} else {
					return -1;
				}
			});
			var isAdmin = req.user ? req.user.role == 'admin' : false;
			res.render("partials/playerList", {
				isAdmin: isAdmin,
				players: players
			}, function(err, html) {
				res.send({ html : html, searchTerm : text });
			});
		});
	})

	app.get("/api/watchlist/encrypted", APP.isUserLoggedIn, function(req, res) {
		WATCHLIST.find({team : req.user.team}, function(err, encrypteds) {
			res.send(encrypteds);
		});
	});

	app.get("/api/schedule/players/:id", function(req, res) {
		SCHEDULE.getPlayersInGames(req.params.id, function(games) {
			res.render("partials/mlbSchedule", {
				games : games,
				showSpinner : false
			}, function(err, html) {
				res.send({ html : html });
			})
		})
	});
}
