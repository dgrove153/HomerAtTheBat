var APP = require('../application/app');
var APPSETTING = require('../models/appSetting');
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
var TEAM = require("../models/team");
var TEAMAPP = require("../application/team");
var MOMENT = require("moment");

module.exports = function(app, passport, io){

	///////
	//ADMIN
	///////

	app.get("/admin", APP.isUserLoggedIn, VULTUREROUTE.getOpenVultures, FAA_ROUTE.getActiveAuctionsScrubBids, function(req, res) {
		APPSETTING.find({}, function(err, settings) {
			res.render("admin", 
			{
				message: req.flash('message'),
				appSettings: settings
			});
		});
	});

	///////////
	//STANDINGS
	///////////


	app.get("/admin/standingsMLB", function(req, res) {
		TEAM.updateStats(function(stats) { 
			res.send('done updating stats via player to team');
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
				if(key == 'fantasy_team') {
					player.history[0].fantasy_team = value;
				} else if(key == 'fantasy_position') {
					player.history[0].fantasy_position = value;
				} else {
					player[key] = value;
				}
				player.save(function(err) {
					req.flash('message', { isSuccess: true, message : 'Saved' });
					res.redirect("/admin/player/" + _id);
				});
			}
		});
	});

	app.get("/admin/playerToTeam", function(req, res) {
		res.send('updating........');
		TEAMAPP.updatePlayerToTeam(function() {
			console.log('DONE UPDATING PLAYER TO TEAM');
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

	app.get("/admin/playerToTeam/:year/:month/:day", function(req, res) {
		var dateString = req.params.year + "-" + req.params.month + "-" + req.params.day + "T04:00:00.000Z";
		var newPlayers = [];
		PLAYER.find({ teamByDate : { "$elemMatch" : { date : new Date(dateString) }}}, function(err, players) {
			players.forEach(function(p) {
				p.teamByDate.forEach(function(t) {
					if(t != null && t.date.getTime() == new Date(dateString).getTime()) {
						p.ariDate = t;
					}
				});
			});
			res.render("playerToTeam", {
				players : newPlayers,
				fullPlayers : players
			});
		});
	});

	app.post("/admin/playerToTeam", function(req, res) {
		var _id = req.body._id;
		var date = new Date(req.body.date);
		var team = req.body.team;
		PLAYER.updateTeamByDateForSpecificDate(_id, date, team, function() {
			var year = date.getFullYear();
			var month = date.getMonth() + 1;
			if(month != "10") {
				month = "0" + month;
			}
			var day = date.getDate();
			if(day < 10) {
				day = "0" + day;	
			}
			res.redirect("/admin/playerToTeam/" + year + "/" + month + "/" + day);
		});
	});

	app.get("/admin/playerToTeam/add/:year/:month/:day", function(req, res) {
		var dateString = req.params.year + "/" + req.params.month + "/" + req.params.day;
		var date = new Date(dateString);
		PLAYER.insertMissingTeamByDate(date, function() {
			var year = date.getFullYear();
			var month = date.getMonth() + 1;
			if(month != "10") {
				month = "0" + month;
			}
			var day = date.getDate();
			if(day < 10) {
				day = "0" + day;	
			}
			res.redirect("/admin/playerToTeam/" + year + "/" + month + "/" + day);
		});
	});

	app.post("/admin/playerToTeam/:_id", function(req, res) {
		var _id = req.params._id;
		var date = new Date(req.body.date);
		var team = req.body.team;
		PLAYER.addTeamByDateForPlayerDate(_id, date, team, function() {
			res.redirect("/player/" + _id);
		});
	});

	//////
	//JEFF
	//////

	app.get("/streak", function(req, res) {
		var JEFF = require("../scripts/jeffStreak");
		JEFF.jeff(res);
	});
}
