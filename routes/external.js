var PLAYER = require('../models/player');
var MLB = require('../external/mlb');
var ESPN = require('../external/espn');

module.exports = function(app, passport){

	/////
	//MLB
	/////

	app.get("/admin/mlb/update/:pid", function(req, res) {
		MLB.getMLBProperties(player_id, function(mlbPlayer) {
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

	app.get("/admin/espn/transactions/:type", function(req, res) {
		ESPN.updateESPN_Transactions(req.params.type, function() {
			res.send('Update in progress');
		});
	});
}