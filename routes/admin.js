var AUTH = require('../config/authorization');
var ADMIN = require('../application/admin');
var PLAYER = require('../models/player');

module.exports = function(app, passport){

	app.get("/admin", function(req, res) {
		res.render("admin", {
			user: req.user
		});
	});

	app.get("/admin/player/:pid", function(req, res) {
		PLAYER.findOne({player_id:req.params.pid}, function(err, player) {
			res.render("adminPlayer", { 
				player: player,
				user: req.user
			});
		});
	});

	app.get("/admin/mlb/update/:pid", function(req, res) {
		ADMIN.updateMLB(req.params.pid, function(player) {
			res.redirect("/admin/player/" + player.player_id);
		});
	});

	app.get("/admin/espn/update/:pid", function(req, res) {
		ADMIN.updateESPN(req, res, function(pid) {
			res.redirect('/admin/player/' + pid);
		});
	});

	app.post("/admin/player/search", function(req, res) {
		PLAYER.find({name_display_first_last:new RegExp(req.body.searchString)}).sort({name_display_first_last:1}).exec(function(err, players) {
			res.send(players);
		});
	})
}
