var AUTH = require('../config/authorization');
var ADMIN = require('../application/admin');
var PLAYER = require('../models/player');

module.exports = function(app, passport){

	app.get("/admin", function(req, res) {
		res.render("admin");
	});

	app.get("/admin/player/:pid", function(req, res) {
		PLAYER.findOne({player_id:req.params.pid}, function(err, player) {
			res.render("adminPlayer", { 
				player: player
			});
		});
	});

	app.get("/admin/mlb/update/:pid", function(req, res) {
		ADMIN.updateMLB(req, res);
	});

	app.get("/admin/espn/update/:pid", function(req, res) {
		ADMIN.updateESPN(req, res);
	})
}
