var PLAYER = require('../models/player');
var MLB = require('../external/mlb');
var ESPN = require('../external/espn');
var TEAM = require('../models/team');
var CONFIG = require('../config/config').config();

module.exports = function(app, passport){

	/////
	//MLB
	/////

	app.get("/admin/mlb/update/:pid", function(req, res) {
		MLB.getMLBProperties(req.params.pid, function(mlbPlayer) {
			PLAYER.updatePlayer_MLB(mlbPlayer, function(player) {
				res.redirect("/admin/player/" + player.player_id);
			});
		});
	});

	app.get("/admin/mlb/updateAll", function(req, res) {
		PLAYER.updateMLB_ALL(function(message) {
			res.send(message);
		});
	});

	//////
	//ESPN
	//////

	app.get("/admin/espn/update/:pid", function(req, res) {
		ESPN.updateESPN(req.params.pid, function(player) {
			res.redirect('/admin/player/' + player.player_id);
		});
	});

	app.get("/admin/espn/updateAll", function(req, res) {
		PLAYER.updateFromESPNLeaguePage(function(message) {
			res.send(message);
		});
	});

	app.get("/admin/espn/transactions", function(req, res) {
		PLAYER.updateFromESPNTransactionsPage('all', function() {
			res.send('Update in progress');
		});
	});

	app.get("/admin/espn/updateStandings/:year", function(req, res) {
		TEAM.getStandings_ESPN(req.params.year, function() {
			res.send('updating standings');
		});
	});

	app.get("/draftProjection", function(req, res) {
		var modifiers = { stats: { "$elemMatch" : {}}};
		var queryParams = req.query;
		for(var param in queryParams) {
			if(param == "source") {
				modifiers['stats']["$elemMatch"]['source'] = queryParams[param];
			} else {
				var string = { "$gte" : queryParams[param] };
				console.log(string)
				modifiers['stats']["$elemMatch"][param] = string;
			}
		}
		console.log(modifiers);
		var DRAFTPROJECTION = require("../models/draftProjection");
		DRAFTPROJECTION.find(modifiers, function(err, players) {
			res.send({ count : players.length , players: players });
		});
	})
}