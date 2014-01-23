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

// var teams = [

// { team_id: 108, team_code: 'ana', club_full_name : 'Los Angeles Angels' },
// { team_id: 109, team_code: 'ari', club_full_name : 'Arizona Diamondbacks' },
// { team_id: 144, team_code: 'atl', club_full_name : 'Atlanta Braves' },
// { team_id: 110, team_code: 'bal', club_full_name : 'Baltimore Orioles' },
// { team_id: 111, team_code: 'bos', club_full_name : 'Boston Red Sox' },
// { team_id: 112, team_code: 'chn', club_full_name : 'Chicago Cubs' },
// { team_id: 113, team_code: 'cin', club_full_name : 'Cincinnati Reds' },
// { team_id: 114, team_code: 'cle', club_full_name : 'Cleveland Indians' },
// { team_id: 115, team_code: 'col', club_full_name : 'Colorado Rockies' },
// { team_id: 145, team_code: 'cha', club_full_name : 'Chicago White Sox' },
// { team_id: 116, team_code: 'det', club_full_name : 'Detroit Tigers' },
// { team_id: 117, team_code: 'hou', club_full_name : 'Houston Astros' },
// { team_id: 118, team_code: 'kca', club_full_name : 'Kansas City Royals' },
// { team_id: 119, team_code: 'lan', club_full_name : 'Los Angeles Dodgers' },
// { team_id: 146, team_code: 'mia', club_full_name : 'Miami Marlins' },
// { team_id: 158, team_code: 'mil', club_full_name : 'Milwaukee Brewers' },
// { team_id: 142, team_code: 'min', club_full_name : 'Minnesota Twins' },
// { team_id: 121, team_code: 'nyn', club_full_name : 'New York Mets' },
// { team_id: 147, team_code: 'nya', club_full_name : 'New York Yankees' },
// { team_id: 133, team_code: 'oak', club_full_name : 'Oakland Athletics' },
// { team_id: 143, team_code: 'phi', club_full_name : 'Philadelphia Phillies' },
// { team_id: 134, team_code: 'pit', club_full_name : 'Pittsburgh Pirates' },
// { team_id: 135, team_code: 'sdn', club_full_name : 'San Diego Padres' },
// { team_id: 136, team_code: 'sea', club_full_name : 'Seattle Mariners' },
// { team_id: 137, team_code: 'sfn', club_full_name : 'San Francisco Giants' },
// { team_id: 138, team_code: 'sln', club_full_name : 'St. Louis Cardinals' },
// { team_id: 139, team_code: 'tba', club_full_name : 'Tampa Bay Rays' },
// { team_id: 140, team_code: 'tex', club_full_name : 'Texas Rangers' },
// { team_id: 141, team_code: 'tor', club_full_name : 'Toronto Blue Jays' },
// { team_id: 120, team_code: 'was', club_full_name : 'Washington Nationals' }
// ];

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

ASYNC.series( [
	function(cb) {
		http.get('http://games.espn.go.com/flb/tools/draftrecap?leagueId=216011',
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
									//console.log(teamHead[0].children[1].children[1].children[0].data);
									var rows = SELECT(team, 'tr');
									rows.forEach(function(r) {
										var name = SELECT(r, 'a.flexpop');
										if(name[0]) {
											//console.log(name[0].children[0].data);
										}
										var priceTD = r.children[2];
										if(priceTD) {
											var price = priceTD.children[0].data;
											price = price.replace('$','');
											draftHash[name[0].children[0].data] = price;
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
	},
	function(cb) {
		http.get('http://razzball.com/playerrater-5x5obp/',
			function(res) {
				var data;
				res.on('data', function(chunk) {
					data += chunk;
				});
				res.on('end', function() {
					var handler = new HTMLPARSE.DefaultHandler(function(err, dom) {
						var count = 0;
						Player.find({}, function(err, players) {
							var playerHash = {};
							players.forEach(function(p) {
								playerHash[p.name_display_first_last] = p;
							});
							var rows = SELECT(dom, 'tr');
							rows.forEach(function(r) {
								var name;
								var link = SELECT(r, 'a');
								if(link[0]) {
									name = link[0].children[0].data;
								}
								var datas = SELECT(r, 'td');
								if(datas[5]) {
									var score = datas[5].children[0].data;
									if(playerHash[name]) {
										var player = playerHash[name];
										if(player && player.history[1].fantasy_team != '' && player.history[1].fantasy_team != undefined
											&& player.history[1].fantasy_team != 'FA') {
											var price = player.history[1].salary == 0 || player.history[1].salary == undefined ? 1 : player.history[1].salary;
											if(draftHash[name] > 0) {
												count++;
												//console.log(name);
												var scorePerDollar;
												scorePerDollar = score / draftHash[name];
												//console.log("SCORE: " + score + " DRAFT VALUE: " + draftHash[name] + " SCOREPERDOLLAR: " + scorePerDollar);
												console.log(score + ", " + draftHash[name]);
											}
										}
									};
								}
							});
							//console.log(count);	
						});
						cb();
					});
					var parser = new HTMLPARSE.Parser(handler);
					parser.parseComplete(data);
				});
			}
		);
	}]);


