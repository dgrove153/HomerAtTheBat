var PLAYER = require('../models/player');
var PLAYERMLB = require('../application/player/update/mlb');
var ESPN = require('../external/espn');
var TEAM = require('../models/team');
var CONFIG = require('../config/config').config();
var DRAFTPROJECTION = require("../models/draftProjection");
var DRAFTAPP = require("../application/draftProjection");

module.exports = function(app, passport){

	/////
	//MLB
	/////

	app.get("/admin/mlb/update/:pid", function(req, res) {
		PLAYERMLB.update(function(count) {
			res.redirect("/admin/player/" + req.params.pid);
		}, req.params.pid);
	});

	app.get("/admin/mlb/updateAll", function(req, res) {
		PLAYERMLB.update(function(count) {
			res.send("saved " + count + " players");
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
}