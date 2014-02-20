var AUTH = require('../config/authorization');
var VULTURE = require('../application/vulture');
var FREEAGENTAUCTION = require('../application/freeAgentAuction');
var PLAYER = require('../models/player');
var PLAYERMLB = require('../application/player/update/mlb');
var NOTIFICATION = require('../models/notification');
var ASYNC = require('async');
var SELECT = require('soupselect').select;
var HTMLPARSE = require('htmlparser2');
var http = require('http');

module.exports = function(app, passport, io){

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

	app.get("/admin/player/:id", function(req, res) {
		PLAYER.findOne({ _id :req.params.id }, function(err, player) {
			var message = req.flash('message');
			res.render("adminPlayer", { 
				title: player.name_display_first_last,
				player: player,
				message: message
			});
		});
	});

	app.post("/admin/player", function(req, res) {
		var body = req.body;
		var _id = req.body._id;
		PLAYER.findOne({ _id : _id }, function(err, player) {
			if(err || !player) {
				req.flash('message', 'Couldn\'t find player with given id');
				res.redirect("/admin/player/" + _id);
			} else {
				var key = req.body.key;
				var value = req.body.value;
				player[key] = value;
				player.save(function(err) {
					req.flash('message', 'Saved');
					res.redirect("/admin/player/" + _id);
				});
			}
		});
	});

	app.post("/admin/roster40", function(req, res) {
		PLAYERMLB.update40ManRosters(function() {
			io.sockets.in(req.user.team).emit('message', { 
				message: 'done adding players'
			});
			res.send('ok');
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

	//////
	//JEFF
	//////

	app.get("/streak", function(req, res) {
		var JEFF = require("../scripts/jeffStreak");
		JEFF.jeff(res);
	});
}
