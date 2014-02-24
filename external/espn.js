var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
var ASYNC = require('async');
var CONFIG = require('../config/config').config();
var MOMENT = require('moment');

/////////////////////////
//ESPN LEAGUE ROSTER PAGE
/////////////////////////

var leagueUrl = "http://games.espn.go.com/flb/leaguerosters?leagueId=216011";

exports.getLeagueRosterPage = function(playerFunction, finishedFunction, _id) {
	var espnPlayerFromDB;
	var count = 0;
	getDom(leagueUrl, function(err, dom) {
		var selectString = 'tr.pncPlayerRow';
		if(_id) {
			selectString = selectString + '#plyr' + _id;
		}
		var rows = SELECT(dom, selectString);
		ASYNC.forEach(rows, function(row, cb) {
			var parent = SELECT(row.parent, 'tr.playertableSectionHeader a');
			var teamId = getTeamIdFromString(parent[0].attribs.href);
			var playerLink = SELECT(row, 'a')[0];
			var positionTD = SELECT(row, 'td')[0];
			
			if(playerLink && playerLink.attribs) {
				var espnPlayerId = playerLink.attribs.playerid;
				var playerName = playerLink.children[0].data;
				var position = positionTD.children[0].data;

				playerFunction(espnPlayerId, playerName, position, teamId, function(player) {
					count++;
					espnPlayerFromDB = player;
					cb();
				});
			} else {
				cb();
			}
		}, function() {
			if(_id) {
				finishedFunction(espnPlayerFromDB);
			} else {
				finishedFunction(count);
			}
		});
	});
}

///////////////////////
//ESPN TRANSACTION PAGE
///////////////////////

exports.getTransactionsPage = function(parseFunction) {
	var now = MOMENT();
	if(now.hour() <= 8) {
		now.subtract('hours',24);
	}
	var dateStr = now.format("YYYYMMDD")
	var url = 
		'http://games.espn.go.com/flb/recentactivity?' + 
		'leagueId=216011&seasonId=2014&activityType=2&startDate=' + dateStr  + '&endDate=' + dateStr  + 
		'&teamId=-1&tranType=-2';
	getDom(url, parseFunction);
};

exports.parseESPNTransactions = function(dom, transactionFunction, jobCallback) {
	var transactionTable = SELECT(dom, '.tableBody');
	transactionTable[0].children.reverse();
	ASYNC.forEachSeries(transactionTable[0].children, function(row, asyncESPNCallback) {
		if(row.name == 'tr') {
			var singleTrans = row.children[2].children;
			if(singleTrans) {
				var time = getTimeFromTransaction(row.children[0]);
				var teamId = getTeamIdFromTransaction(row.children[3]);
				var parameters = [];
				for(var i = 0; i < singleTrans.length; i = i + 4) {
					var action = singleTrans[i].data.split(' ');
					var team = teamId;
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

////////////
//ESPN DRAFT
////////////

var draftUrl = 'http://games.espn.go.com/flb/tools/draftrecap?leagueId=216011&seasonId=';
var espnDraftCallback;

var parseDraft = function(err, dom) {
	var tables = SELECT(dom, '.games-innercol2 table');
	var teams = SELECT(tables[0], 'table');
	ASYNC.forEachSeries(teams, function(team, teamCb) {
		var teamId;
		var players = SELECT(team, 'tr');
		ASYNC.forEachSeries(players, function(player, playerCb) {
			var cells = SELECT(player, 'td');
			if(cells.length == 1) {
				var teamLink = SELECT(cells, 'a');
				teamId = teamLink[0].attribs.href.match(/teamId=\d+/);
				teamId = teamId[0].replace('teamId=','');
				playerCb();
			} else if(cells.length == 3) {
				var playerLink = SELECT(player, 'a');
				var keeperSelection = SELECT(player, 'span');
				
				var isKeeper = false;
				if(keeperSelection.length > 0) {
					isKeeper = true;
				}
				var dollars = cells[2].children[0].data.replace('$','');

				var playerId = playerLink[0].attribs.playerid;
				var playerName = playerLink[0].children[0].data;
				espnDraftCallback(playerName, playerId, teamId, dollars, isKeeper, playerCb);
			}
		}, function(err) {
			teamCb();
		});
	});
}

exports.getDraft = function(year, callback) {
	espnDraftCallback = callback;
	var url = draftUrl + year;
	getDom(url, parseDraft);
}

///////////////////////
//ESPN PLAYER ID FINDER
///////////////////////

var playerFinderUrl = 
	'http://games.espn.go.com/flb/freeagency?leagueId=216011&seasonId=2014&search=PLAYERNAME&slotCategoryGroup=SLOTCATEGORY&avail=-1';
var espnPlayerFinderCallback;
var espnPlayerFinderCallback2;
var playerSearchName;

var parseFreeAgentPage = function(err, dom) {
	var players = SELECT(dom, 'tr.pncPlayerRow');
	console.log("length: " + players.length);
	var foundPlayer = false;
	ASYNC.forEachSeries(players, function(player, cb) {
		var playerLink = SELECT(player, 'a');	
		var playerId = playerLink[0].attribs.playerid;
		var playerName = playerLink[0].children[0].data;
		if(!foundPlayer && playerName == playerSearchName) {
			foundPlayer = true;
			espnPlayerFinderCallback(playerSearchName, playerId);
		}
		cb();
	}, function(err) {
		if(!foundPlayer) {
			espnPlayerFinderCallback();
		}
	});
}

exports.findPlayerId = function(lastName, fullName, isBatter, callback) {
	espnPlayerFinderCallback = callback;
	playerSearchName = fullName;
	var slotCategory = isBatter ? 1 : 2;
	var url = playerFinderUrl.replace('PLAYERNAME', lastName).replace('SLOTCATEGORY', slotCategory);
	getDom(url, parseFreeAgentPage);
}

/////////
//HELPERS
/////////

var getDom = function(url, parseFunction) {
	HTTP.get(url, function(res) {
		var data;
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function() {
			var handler = new HTMLPARSE.DefaultHandler(parseFunction);
			var parser = new HTMLPARSE.Parser(handler);
			parser.parseComplete(data);
		});
	});
}

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

var getTeamIdFromTransaction = function(row) {
	return getTeamIdFromString(row.children[0].attribs['href']);
}

var getTeamIdFromString = function(str) {
	var link = str.match(/teamId=(\d)+/g)[0];
	teamId = link.replace("teamId=",'');
	return teamId;	
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