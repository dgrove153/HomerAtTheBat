var AUTH = require('../config/authorization');
var VULTURE = require('../application/vulture');
var FREEAGENTAUCTION = require('../models/freeAgentAuction');
var PLAYER = require('../models/player');
var NOTIFICATION = require('../models/notification');

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
	//NOTIFICATION
	/////////

	app.post("/admin/notification/dismiss/:nid", function(req, res) {
		console.log(req.params.nid);
		NOTIFICATION.findOne({_id : req.params.nid}, function(err, notification) {
			notification.dismissed = true;
			notification.save(function() {
				res.send('Dismissed');
			});
		})
	});

	app.post("/admin/notification/create/", function(req, res) {
		var type = req.body.type;
		var player_name = req.body.player_name;
		var team = req.body.team;
		var message = req.body.message;
		NOTIFICATION.createNew(type, player_name, team, message, function(result) {
			req.flash('info', "'" + message + "' has been pushed");
			res.redirect('/admin');
		}, res.locals.teams);
	});
}
