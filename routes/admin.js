var AUTH = require('../config/authorization');
var VULTURE = require('../application/vulture');
var FREEAGENTAUCTION = require('../models/freeAgentAuction');
var PLAYER = require('../models/player');
var WARNING = require('../models/warning');

module.exports = function(app, passport){

	///////
	//ADMIN
	///////

	app.get("/admin", VULTURE.getOpenVultures, FREEAGENTAUCTION.getFinishedAuctions, function(req, res) {
		var str = req.flash('info');
		res.render("admin", 
			{
				message: str
			});
	});

	////////
	//PLAYER
	////////

	app.get("/admin/player/:pid", function(req, res) {
		PLAYER.findOne({player_id:req.params.pid}, function(err, player) {
			res.render("adminPlayer", { 
				player: player
			});
		});
	});

	////////
	//SEARCH
	////////

	app.post("/admin/player/search", function(req, res) {
		PLAYER.find({name_display_first_last:new RegExp(" " + req.body.searchString)}).sort({name_display_first_last:1}).exec(function(err, players) {
			res.send(players);
		});
	});

	////////
	//UPDATE
	////////

	app.post("/admin/json/update", function(req, res) {
		console.log(req.body.json);
		var json = JSON.parse(req.body.json);
		PLAYER.findByIdAndUpdate(json._id, json, function(err, data) {
			console.log(data);
			res.send(data);
		});
	});

	app.post("/admin/vulture", function(req, res) {
		console.log("VULTURE PID:" + req.body);
		VULTURE.overrideVultureCancel(req.body.pid, function(message) {
			req.flash('info', message);
			res.redirect('/admin');
		});
	});

	/////////
	//WARNING
	/////////

	app.post("/admin/warning/:wid", function(req, res) {
		console.log(req.params.wid);
		WARNING.findOne({_id : req.params.wid}, function(err, warning) {
			warning.dismissed = true;
			warning.save(function() {
				res.send('Dismissed');
			});
		})
	})
}
