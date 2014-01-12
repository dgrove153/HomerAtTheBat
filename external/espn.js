var PLAYER = require("../models/player");
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
var ASYNC = require('async');
var UTIL = require('../application/util');

//////
//ESPN
//////

var leagueUrl = "http://games.espn.go.com/flb/leaguerosters?leagueId=216011";

var parseESPNRow = function(playerRow, callback) {
	try {
		var id = playerRow.children[1].children[0].attribs.playerid;
		var name = playerRow.children[1].children[0].children[0].data;
		var position = playerRow.children[0].children[0].data;
		PLAYER.findOne({espn_player_id: id}, function(err, dbPlayer) {
			if(dbPlayer != null) {
				dbPlayer.fantasy_position = position;
				dbPlayer.fantasy_status_code = UTIL.positionToStatus(position);
				dbPlayer.espn_player_id = id;
				dbPlayer.save();
				callback(dbPlayer);
			}
		});
	} catch(e) {
		console.log(e);
	}
}

var getLeaguePage = function(callback) {
	HTTP.get(leagueUrl, function(espn) {
		var body = '';
		espn.on('data', function(chunk) {
			body += chunk;
		});
		espn.on('end', function() {
			var handler = new HTMLPARSE.DefaultHandler(callback);
			var parser = new HTMLPARSE.Parser(handler);
			parser.parseComplete(body);
		});
	});
}

exports.updateESPN = function(pid, callback) {
	getLeaguePage(function(err, dom) {
		var selectString = 'tr.pncPlayerRow#plyr' + pid;
		var rows = SELECT(dom, selectString);
		for(var i = 0; i < rows.length; i++) {
			var playerRow = rows[i];
			parseESPNRow(playerRow, callback);
		}
	});
}

exports.updateESPN_ALL = function(callback) {
	var count = 0;
	getLeaguePage(function(err, dom) {
		var rows = SELECT(dom, 'tr.pncPlayerRow');
		for(var i = 0; i < rows.length; i++) {
			var playerRow = rows[i];
			parseESPNRow(playerRow, function(p) {
				count++;
			});
		}
		callback('updating');
	});
}

var tranType = {};
tranType.moved = 1;
tranType.added = 2;
tranType.dropped = 3;
tranType.traded = 4;
tranType.drafted = 5;
tranType.all = -2;

var playerHistory_ESPN = 1;

var parseESPNTransactions = function(dom, callback) {
	var transactionTable = SELECT(dom, '.tableBody');
	transactionTable[0].children.reverse();
	ASYNC.forEachSeries(transactionTable[0].children, function(row, rowCB) {
		if(row.name == 'tr') {
			var singleTrans = row.children[2].children;
			if(singleTrans) {
				var time = row.children[0].children[2].data;
				var hour = time.split(' ')[0].split(':')[0];
				var minute = time.split(' ')[0].split(':')[1];
				var amPm = time.split(' ')[1];
				var functions = [];
				for(var i = 0; i < singleTrans.length; i = i + 4) {
					var action = singleTrans[i].data.split(' ');
					var team = action[0];
					var move = action[1];
					var name = singleTrans[i + 1].children[0].data;
					var text = singleTrans[i+2].data;
					console.log(text);
					functions.push({name: name, team: team, text: text, move: move, time: time});
				}
				ASYNC.forEachSeries(functions, function(func, funcCB) {
					console.log(func.name + " " + func.move);
					callback(funcCB, func.name, func.team, func.text, func.move, func.time);
				}, function(err) {
					rowCB();
				});
			}
		}
	});
};

var parseESPNTransactions_Move = function(err, dom) {
	parseESPNTransactions(dom, function(rowCB, playerName, team, text, move, time) {
		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
			if(player) {
				if(player.history[playerHistory_ESPN].fantasy_team == team) {
					var textArr = text.split(' ');
					var position = textArr[6];
					console.log(position);
					player.history[playerHistory_ESPN].fantasy_position = position;
					player.fantasy_status_code = UTIL.positionToStatus(position);
					console.log('switching ' + player.name_display_first_last + ' to ' + position);
					player.save(function(err) {
						rowCB();
					});
				} else {
					console.log(player.name_display_first_last + " is no longer on " + team);
					rowCB();
				}
			}
		});	
	});
}

var parseESPNTransactions_Drop = function(callback, player, espn_team, text, move, time) {
	if(player.history[playerHistory_ESPN].fantasy_team == espn_team) {
		player.last_team = player.history[playerHistory_ESPN].fantasy_team;
		//player.last_dropped = time;
		player.last_dropped = new Date();
		player.history[playerHistory_ESPN].fantasy_team = 'FA';
		console.log("dropping " + player.name_display_first_last + " from " + espn_team);
		player.save(function(err) {
			callback();
		});
	} else {
		console.log(player.name_display_first_last + " not on " + espn_team + ", can't drop");
		callback();
	}
};

var parseESPNTransactions_Add = function(callback, player, espn_team, text, move, time) {
	if(player.history[playerHistory_ESPN].fantasy_team != espn_team) {
		if(player.last_dropped) {
			var contract_year_retain_cutoff = new Date(player.last_dropped.getTime() + 1*60000);
			//var now = time;
			var now = new Date();
			if(player.last_team != espn_team || now > contract_year_retain_cutoff) {
				console.log("changing " + player.name_display_first_last + " contract year to 0");
				player.history[playerHistory_ESPN].contract_year = 0;
			}
		}
		player.history[playerHistory_ESPN].fantasy_team = espn_team;
		console.log("adding " + player.name_display_first_last + " to " + espn_team);
		player.save(function(err) {
			callback();
		});
	} else {
		console.log(player.name_display_first_last + " is already on " + espn_team + ", can't add");
		callback();
	}
}

var parseESPNTransactions_All = function(err, dom) {
	parseESPNTransactions(dom, function(rowCB, playerName, team, text, move, time) {
		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
			if(player) {
				tranToFunction[move](rowCB, player, team, text, move, time);
			}
		});	
	});
};

var tranToFunction = {};
tranToFunction.dropped = parseESPNTransactions_Drop;
tranToFunction.added = parseESPNTransactions_Add;
tranToFunction.moved = parseESPNTransactions_Move;
tranToFunction.moved = parseESPNTransactions_Move;
tranToFunction.all = parseESPNTransactions_All;

exports.updateESPN_Transactions = function(type) {
	var now = new Date();
	var dateStr = now.getFullYear() + '' 
		+ ('0' + (now.getMonth()+1)).slice(-2) + '' 
		+ ('0' + now.getDate()).slice(-2);
	console.log(dateStr);
	var url = 
		'http://games.espn.go.com/flb/recentactivity?' + 
		'leagueId=216011&seasonId=2013&activityType=2&startDate=' + dateStr  + '&endDate=' + dateStr  + 
		'&teamId=-1&tranType=' + tranType[type];
	HTTP.get(url, function(res) {
		var data;
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function() {
			var handler = new HTMLPARSE.DefaultHandler(tranToFunction[type]);
			var parser = new HTMLPARSE.Parser(handler);
			parser.parseComplete(data);
		});
	});
};