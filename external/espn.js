// var PLAYER = require("../models/player");
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
var ASYNC = require('async');
var UTIL = require('../application/util');
var CONFIG = require('../config/config');
var AUDIT = require('../models/externalAudit');

/////////////////////////
//ESPN LEAGUE ROSTER PAGE
/////////////////////////

var leagueUrl = "http://games.espn.go.com/flb/leaguerosters?leagueId=216011";

exports.updateESPN_ALL = function(playerFunction) {
	getLeaguePage(function(err, dom) {
		var rows = SELECT(dom, 'tr.pncPlayerRow');
		for(var i = 0; i < rows.length; i++) {
			var playerRow = rows[i];
			parseESPNRow(playerRow, playerFunction);
		}
		// callback('updating');
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

var parseESPNRow = function(playerRow, playerFunction) {
	try {
		var id = playerRow.children[1].children[0].attribs.playerid;
		var name = playerRow.children[1].children[0].children[0].data;
		var position = playerRow.children[0].children[0].data;
		playerFunction(id, name, position);
		//PLAYER.updatePlayer_ESPN(id, name, position, callback);
	} catch(e) {
		console.log(e);
	}
}

///////////////////////
//ESPN TRANSACTION PAGE
///////////////////////

exports.updateESPN_Transactions = function(type, tranToFunction, jobCallback) {
	globalCallback = jobCallback;
	var now = new Date();
	var dateStr = now.getFullYear() + '' 
		+ ('0' + (now.getMonth()+1)).slice(-2) + '' 
		+ ('0' + now.getDate()).slice(-2);
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

var parseESPNTransactions = function(dom, transactionFunction, jobCallback) {
	var transactionTable = SELECT(dom, '.tableBody');
	transactionTable[0].children.reverse();
	ASYNC.forEachSeries(transactionTable[0].children, function(row, asyncESPNCallback) {
		if(row.name == 'tr') {
			var singleTrans = row.children[2].children;
			if(singleTrans) {
				var time = getTimeFromTransaction(row.children[0]);
				var parameters = [];
				for(var i = 0; i < singleTrans.length; i = i + 4) {
					var action = singleTrans[i].data.split(' ');
					var team = action[0];
					var move = action[1];
					var name = singleTrans[i + 1].children[0].data;
					var text = singleTrans[i+2].data;
					parameters.push({name: name, team: team, text: text, move: move, time: time});
				}
				ASYNC.forEachSeries(parameters, function(params, asyncTransactionFunctionCallback) {
					transactionFunction(asyncTransactionFunctionCallback, params.name, params.team, params.text, params.move, params.time);
				}, function(err) {
					asyncESPNCallback();
				});
			} else {
				asyncESPNCallback();
			}
		} else {
			asyncESPNCallback();
		}
	}, function(err) {
		jobCallback();
	});
};

exports.parseESPNTransactions = parseESPNTransactions;

// var parseESPNTransactions_Drop = function(asyncCallback, player, espn_team, text, move, time) {
// 	AUDIT.isDuplicate('ESPN_TRANSACTION', player.name_display_first_last, 'FA', 'DROP', time, function(isDuplicate) {
// 		if(!isDuplicate) {
// 			if(player.fantasy_team == espn_team) {
// 				//write to console
// 				console.log("dropping " + player.name_display_first_last + " from " + espn_team);

// 				//set last team properties
// 				player.last_team = player.fantasy_team;
// 				player.last_dropped = time;
				
// 				PLAYER.updatePlayerTeam(player, 'FA', CONFIG.year, function() { 
// 					AUDIT.auditESPNTran(player.name_display_first_last, 'FA', 'DROP', time, 
// 						player.name_display_first_last + " dropped by " + player.last_team);
// 					asyncCallback();
// 				});
// 			} else {
// 				//this move is outdated
// 				console.log(player.name_display_first_last + " not on " + espn_team + ", can't drop");
// 				asyncCallback();
// 			}
// 		} else {
// 			console.log("dropping " + player.name_display_first_last + " from " + player.last_team + " has already been handled");
// 			asyncCallback();
// 		}
// 	})
// };

// var parseESPNTransactions_Add = function(asyncCallback, player, espn_team, text, move, time) {
// 	AUDIT.isDuplicate('ESPN_TRANSACTION', player.name_display_first_last, espn_team, 'ADD', time, function(isDuplicate) {
// 		if(!isDuplicate) {
// 			if(player.fantasy_team != espn_team) {
// 				console.log("adding " + player.name_display_first_last + " to " + espn_team);

// 				if(PLAYER.isMinorLeaguerNotFreeAgent(player, espn_team)) {
// 					console.log(player.name_display_first_last + " cannot be added to a team because they are a minor leaguer for " +
// 						player.fantasy_team);
// 					asyncCallback();
// 				}

// 				//check to see if we need to reset contract year
// 				if(PLAYER.shouldResetContractYear(player, espn_team, time)) {
// 					console.log("changing " + player.name_display_first_last + " contract year to 0");

// 					var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
// 					player.history[historyIndex].contract_year = 0;
// 				}

// 				PLAYER.updatePlayerTeam(player, espn_team, CONFIG.year, function() { 
// 					AUDIT.auditESPNTran(player.name_display_first_last, espn_team, 'ADD', time, 
// 						player.name_display_first_last + " added by " + espn_team);
// 					asyncCallback();
// 				});
// 			} else {
// 				console.log(player.name_display_first_last + " is already on " + espn_team + ", can't add");
// 				asyncCallback();
// 			}
// 		} else {
// 			console.log("adding " + player.name_display_first_last + " to " + espn_team + " has already been handled");
// 			asyncCallback();
// 		}
// 	});
// }

var globalCallback;
exports.setGlobalCallback = function(cb) {
	globalCallback = cb;
}

// var parseESPNTransactions_All = function(err, dom) {
// 	parseESPNTransactions(dom, function(rowCB, playerName, team, text, move, time) {
// 		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
// 			if(player) {
// 				tranToFunction[move](rowCB, player, team, text, move, time);
// 			} else {
// 				console.log(playerName + ' not found');
// 				rowCB();
// 			}
// 		});	
// 	}, globalCallback);
// };

// var parseESPNTransactions_Move = function(err, dom) {
// 	parseESPNTransactions(dom, function(rowCB, playerName, team, text, move, time) {
// 		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
// 			if(player) {
// 				var historyIndex = PLAYER.findHistoryIndex(player, CONFIG.year);
// 				if(player.history[historyIndex].fantasy_team == team) {
// 					var textArr = text.split(' ');
// 					var position = textArr[6];
// 					//player.history[historyIndex].fantasy_position = position;
// 					//player.fantasy_status_code = UTIL.positionToStatus(position);
// 					//console.log('switching ' + player.name_display_first_last + ' to ' + position);
// 					player.save(function(err) {
// 						rowCB();
// 					});
// 				} else {
// 					console.log(player.name_display_first_last + " is no longer on " + team);
// 					rowCB();
// 				}
// 			}
// 		});	
// 	});
// }

/////////
//HELPERS
/////////

var getTimeFromTransaction = function(row) {
	var date = row.children[0].data;
	var time = row.children[2].data;

	var month = monthToDay[date.split(' ')[1]];
	var day = date.split(' ')[2];

	var hour = time.split(' ')[0].split(':')[0];
	var minute = time.split(' ')[0].split(':')[1];
	var amPm = time.split(' ')[1];
	if(amPm == 'PM' && hour != 12) {
		hour = parseInt(hour) + 12;
	}

	var fullDate = new Date(CONFIG.year, month, day, hour, minute, 0, 0);
	return fullDate;
}

var tranToFunction = {};
tranToFunction.dropped = parseESPNTransactions_Drop;
tranToFunction.added = parseESPNTransactions_Add;
// tranToFunction.moved = parseESPNTransactions_Move;
tranToFunction.all = parseESPNTransactions_All;

var tranType = {};
tranType.moved = 1;
tranType.added = 2;
tranType.dropped = 3;
tranType.traded = 4;
tranType.drafted = 5;
tranType.all = -2;

var monthToDay = {};
monthToDay.Jan = 0;
monthToDay.Feb = 1;
monthToDay.Mar = 2;
monthToDay.Apr = 3;
monthToDay.May = 4;
monthToDay.Jun = 5;
monthToDay.Jul = 6;
monthToDay.Aug = 7;
monthToDay.Sep = 8;
monthToDay.Oct = 9;
monthToDay.Nov = 10;
monthToDay.Dec = 11;