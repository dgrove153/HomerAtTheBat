var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
var ASYNC = require('async');
var CONFIG = require('../config/config');

/////////////////////////
//ESPN LEAGUE ROSTER PAGE
/////////////////////////

var leagueUrl = "http://games.espn.go.com/flb/leaguerosters?leagueId=216011";

exports.updateESPN_LeaguePage = function(pid, playerFunction) {
	getLeaguePage(function(err, dom) {
		var selectString = 'tr.pncPlayerRow';
		if(pid) {
			selectString = selectString + '#plyr' + pid;
		}
		var rows = SELECT(dom, selectString);
		for(var i = 0; i < rows.length; i++) {
			var playerRow = rows[i];
			parseESPNRow(playerRow, playerFunction);
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
	} catch(e) {
		console.log(e);
	}
}

///////////////////////
//ESPN TRANSACTION PAGE
///////////////////////

exports.updateESPN_Transactions = function(type, tranToFunction) {
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

exports.parseESPNTransactions = function(dom, transactionFunction, jobCallback) {
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

/////////////////////
//ESPN STANDINGS PAGE
/////////////////////

var espnStandingsCallback;

var parseESPNStandingsPage = function(err, dom) {
	var table = SELECT(dom, '.tableBody .sortableRow');
	var teamHash = {};
	table.forEach(function(row) {
		var rank = row.children[0].children[0].data;
		var name = row.children[1].children[0].children[0].data;
		var oldRank;
		if(teamHash[name]) {
			oldRank = teamHash[name];
		}
		if(oldRank && oldRank != rank) {
			teamHash[name] = rank;
		} else if(!oldRank) {
			teamHash[name] = rank;
		}
	});
	espnStandingsCallback(teamHash);
}

exports.getESPNStandings = function(year, callback) {
	espnStandingsCallback = callback;

	var url = 'http://games.espn.go.com/flb/standings?leagueId=216011&seasonId=' + year;
	HTTP.get(url, function(res) {
		var data;
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function() {
			var handler = new HTMLPARSE.DefaultHandler(parseESPNStandingsPage);
			var parser = new HTMLPARSE.Parser(handler);
			parser.parseComplete(data);
		});
	});
}

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