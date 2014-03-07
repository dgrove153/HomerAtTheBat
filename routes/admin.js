var APP = require('../application/app');
var AUTH = require('../config/authorization');
var VULTUREROUTE = require('../application/vulture/route');
var FAA_ROUTE = require('../application/freeAgentAuction/route');
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

	app.get("/admin", APP.isUserLoggedIn, VULTUREROUTE.getOpenVultures, FAA_ROUTE.getFinishedAuctions, function(req, res) {
		res.render("admin", 
			{
				message: req.flash('message')
			});
	});

	////////
	//PLAYER
	////////

	app.get("/admin/player/:id", function(req, res) {
		PLAYER.findOne({ _id :req.params.id }, function(err, player) {
			res.render("adminPlayer", { 
				title: player.name_display_first_last,
				player: player,
				message: req.flash('message')
			});
		});
	});

	app.post("/admin/player", function(req, res) {
		var body = req.body;
		var _id = req.body._id;
		PLAYER.findOne({ _id : _id }, function(err, player) {
			if(err || !player) {
				req.flash('message', { isSuccess: false, message : 'Couldn\'t find player with given id' });
				res.redirect("/admin/player/" + _id);
			} else {
				var key = req.body.key;
				var value = req.body.value;
				player[key] = value;
				player.save(function(err) {
					req.flash('message', { isSuccess: true, message : 'Saved' });
					res.redirect("/admin/player/" + _id);
				});
			}
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
			req.flash('message', { isSuccess: true, message : "'" + message + "' has been pushed" });
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
