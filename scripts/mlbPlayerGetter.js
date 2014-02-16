var Player = require('../models/player');
var SELECT = require('soupselect').select;
var HTMLPARSE = require('htmlparser2');
var http = require('http');
var mongoose = require('mongoose');
var ASYNC = require('async');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

// var ari = function(myVar) {
// 		var jsonPlayer = myVar;
// 		Player.findOne({ name_display_first_last: jsonPlayer.name_display_first_last}, function(err, player) {
// 			if(err) throw err;
// 			if(!player) {
// 				//create player
// 				var p = new Player(jsonPlayer);
// 				var y2013 = { year: 2013 };
// 				var y2014 = { year: 2014 };
// 				p.history.unshift(y2013);
// 				p.history.unshift(y2014);
// 				p.save(function(err) {
// 					if(err) console.log(err);
// 				});
// 				console.log("Created player: " + jsonPlayer.name_display_first_last);
// 			} else {
// 				//update player
// 				//player.history[0].year=2015;
// 				//player.save();
// 				//console.log("Updated player: " + player.name_display_first_last);
// 			}
// 		});
// 	};

// for(var j = 0; j< teams.length; j++) {
// 	console.log('getting team ' + teams[j].club_full_name);
// 	http.get('http://mlb.mlb.com/lookup/json/named.roster_40.bam?team_id=' + teams[j].team_id, function(res) {
// 		var output = '';
// 		res.on('data', function(chunk) {
// 			output += chunk;
// 		});
// 		res.on('end', function() {
// 			var json = JSON.parse(output);
// 			var playerList = json.roster_40.queryResults.row;
// 			for(var i = 0; i < playerList.length; i++) {
// 				ari(playerList[i]);
// 			}
// 		});
// 	});
// }

// http.get('http://games.espn.go.com/flb/recentactivity?leagueId=216011&seasonId=2013&activityType=-1&startDate=20130828&endDate=20130904&teamId=-1&tranType=-2',
// 	function(res) {
// 		var data;
// 		res.on('data', function(chunk) {
// 			data += chunk;
// 		});
// 		res.on('end', function() {
// 			console.log(data);
// 		});
// 	}
// );

var draftHash = {};
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
											draftHash[name] = price;
											Player.findOne({name_display_first_last : name}, function(err, player) {
												if(player) {
													var newHistory = { 
														draft_team : teamHash[teamName],
														year : 2012 , 
														salary : price };
													player.history.push(newHistory);
													player.save();
													//console.log(teamHash[teamName] + " " + name + " " + price);
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
	// ,
	// function(cb) {
	// 	http.get('http://razzball.com/playerrater-5x5obp/',
	// 		function(res) {
	// 			var data;
	// 			res.on('data', function(chunk) {
	// 				data += chunk;
	// 			});
	// 			res.on('end', function() {
	// 				var handler = new HTMLPARSE.DefaultHandler(function(err, dom) {
	// 					var count = 0;
	// 					Player.find({}, function(err, players) {
	// 						var playerHash = {};
	// 						players.forEach(function(p) {
	// 							playerHash[p.name_display_first_last] = p;
	// 						});
	// 						var rows = SELECT(dom, 'tr');
	// 						rows.forEach(function(r) {
	// 							var name;
	// 							var link = SELECT(r, 'a');
	// 							if(link[0]) {
	// 								name = link[0].children[0].data;
	// 							}
	// 							var datas = SELECT(r, 'td');
	// 							if(datas[5]) {
	// 								var score = datas[5].children[0].data;
	// 								if(playerHash[name]) {
	// 									var player = playerHash[name];
	// 									if(player && player.history[1].fantasy_team != '' && player.history[1].fantasy_team != undefined
	// 										&& player.history[1].fantasy_team != 'FA') {
	// 										var price = player.history[1].salary == 0 || player.history[1].salary == undefined ? 1 : player.history[1].salary;
	// 										if(draftHash[name] > 0) {
	// 											count++;
	// 											//console.log(name);
	// 											var scorePerDollar;
	// 											scorePerDollar = score / draftHash[name];
	// 											//console.log("SCORE: " + score + " DRAFT VALUE: " + draftHash[name] + " SCOREPERDOLLAR: " + scorePerDollar);
	// 											console.log(score + ", " + draftHash[name]);
	// 										}
	// 									}
	// 								};
	// 							}
	// 						});
	// 						//console.log(count);	
	// 					});
	// 					cb();
	// 				});
	// 				var parser = new HTMLPARSE.Parser(handler);
	// 				parser.parseComplete(data);
	// 			});
	// 		}
	// 	);
	// }
	]);


