var AUTH = require('../config/authorization');
var VULTURE = require('../application/vulture');
var FREEAGENTAUCTION = require('../models/freeAgentAuction');
var PLAYER = require('../models/player');
var NOTIFICATION = require('../models/notification');
var ASYNC = require('async');
var SELECT = require('soupselect').select;
var HTMLPARSE = require('htmlparser2');
var http = require('http');

module.exports = function(app, passport){

	app.get("/admin/oneTimer", function(req, res) {
		var teamHash = {
			'CROWN HEIGHTS RIOTS':'SIDO',
			'THE GLORIOLES':'GLRY',
			'MANHATTAN MASHERS':'CHOB',
			'MAGIC JOHNSON':'HIV+',
			'LESLIE KNOPES':'GOB',
			'GROVE IS OVERRATED':'SHAW',
			'RON PAUL REVOLUTION':'GRAN',
			'JEFF BERKASAURUS REX':'JEFF',
			'THE BAGHDAD DADDY BAGS':'DBAG',
			'FLATIRON FASTBALLS':'MAD',
			'LAS VEGAS ISOTOPES':'LAZ',
			'YOU ARE NOT THE FATHER':'PUIG'
		};
		res.send('working on it');
		ASYNC.series( [
			function(cb) {
				var url2012 = 'http://games.espn.go.com/flb/tools/draftrecap?leagueId=216011&seasonId=2012';
				var url2013 = 'http://games.espn.go.com/flb/tools/draftrecap?leagueId=216011';
				http.get(url2012,
					function(res) {
						var data;
						res.on('data', function(chunk) {
							data += chunk;
						});
						res.on('end', function() {
							var handler = new HTMLPARSE.DefaultHandler(
								function(err, dom) {
									var allTeams = SELECT(dom, 'table');
									// var teamRow = SELECT(allTeams[1], 'tr');
									var teamRows = [];
									allTeams[1].children.forEach(function(row) {
										if(row.name == 'tr') {
											teamRows.push(row);
										}
									});
									teamRows.forEach(function(row) {
										var teams = SELECT(row, 'table');
										var ari = SELECT(teams, 'tr.tableHead');
										teams.forEach(function(team) {
											var teamHead = SELECT(team, 'tr.tableHead');
											var teamName = teamHead[0].children[1].children[1].children[0].data;
											var rows = SELECT(team, 'tr');
											rows.forEach(function(r) {
												var nameLink = SELECT(r, 'a.flexpop');
												var name;
												if(nameLink[0]) {
													name = nameLink[0].children[0].data;
												}
												var priceTD = r.children[2];
												if(priceTD) {
													var price = priceTD.children[0].data;
													price = price.replace('$','');
													PLAYER.findOne({name_display_first_last : name}, function(err, player) {
														if(player) {
															var newHistory = { 
																draft_team : teamHash[teamName],
																year : 2012 , 
																salary : price };
															player.history.push(newHistory);
															player.save();
															console.log(teamHash[teamName] + " " + name + " " + price);
														} else {
															console.log("couldn't find " + name);
														}
													});
												}
											});
										})
									});
									cb();
								});
							var parser = new HTMLPARSE.Parser(handler);
							parser.parseComplete(data);
						});
					}
				);
			}
		]);
	});

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
