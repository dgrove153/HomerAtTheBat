var PLAYER = require("../models/player");
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
var ASYNC = require('async');

/////////
//MLB.COM
///////// 
exports.createMLBPlayer = function(pid, callback) {
	HTTP.get("http://mlb.com/lookup/json/named.player_info.bam?sport_code='mlb'&player_id=" + pid, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			var json = JSON.parse(output);
			var mlbPlayer = json.player_info.queryResults.row;
			var player = new PLAYER({
				name_display_first_last: mlbPlayer.name_display_first_last,
				position_txt: mlbPlayer.position_txt,
				primary_position: mlbPlayer.primary_position,
				status_code: mlbPlayer.status_code,
				team_code: mlbPlayer.team_code,
				team_id: mlbPlayer.team_id,
				team_name: mlbPlayer.team_name
			});
			player.save();
		});
	});
}

exports.findMLBPlayer = function(pid, callback) {
	HTTP.get("http://mlb.com/lookup/json/named.player_info.bam?sport_code='mlb'&player_id=" + pid, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			var json = JSON.parse(output);
			var mlbPlayer = json.player_info.queryResults.row;
			return callback(mlbPlayer);
		});
	});
}

var updateMLB = function(pid, callback) {
	HTTP.get("http://mlb.com/lookup/json/named.player_info.bam?sport_code='mlb'&player_id=" + pid, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			var json = JSON.parse(output);
			var mlbPlayer = json.player_info.queryResults.row;
			PLAYER.findOne({player_id: pid}, function(err, p) {
				if(err) {
					throw err;
				}
				p.status_code = mlbPlayer.status_code;
				p.team_name = mlbPlayer.team_name;
				p.team_code = mlbPlayer.team_code;
				p.status_code = positionToStatus(mlbPlayer.status_code);
				p.position_txt = mlbPlayer.primary_position_txt;
				p.primary_position = mlbPlayer.primary_position;
				p.save();
				callback(p);
			});
		});
	});
};

exports.updateMLB_ALL = function(callback) {
	var count = 0;
	PLAYER.find({}, function(err, docs) {
		for(var i = 0; i < docs.length; i++) {
			if(docs[i].player_id != undefined) {
				console.log("updating " + docs[i].name_display_first_last);
				updateMLB(docs[i].player_id, function(p) {
					count++;
				});
			}
		}
		callback('updating');
	});
}

exports.updateMLB = updateMLB;

//////
//ESPN
//////

var parseESPNRow = function(playerRow, callback) {
	try {
		var id = playerRow.children[1].children[0].attribs.playerid;
		var name = playerRow.children[1].children[0].children[0].data;
		var position = playerRow.children[0].children[0].data;
		console.log(playerRow.children[1]);
		PLAYER.findOne({espn_player_id: id}, function(err, dbPlayer) {
			if(dbPlayer != null) {
				dbPlayer.fantasy_position = position;
				dbPlayer.fantasy_status_code = positionToStatus(position);
				dbPlayer.espn_player_id = id;
				dbPlayer.save();
				callback(dbPlayer);
			}
		});
	} catch(e) {
		console.log(e);
	}
}

var getESPNDoc = function(callback) {
	HTTP.get("http://games.espn.go.com/flb/leaguerosters?leagueId=216011", function(espn) {
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

var tranType = {};
tranType.moved = 1;
tranType.added = 2;
tranType.dropped = 3;
tranType.traded = 4;
tranType.drafted = 5;
tranType.all = -2;

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
				console.log(hour + ":" + minute + " " + amPm);
				var functions = [];
				for(var i = 0; i < singleTrans.length; i = i + 4) {
					var action = singleTrans[i].data.split(' ');
					var team = action[0];
					var move = action[1];
					var name = singleTrans[i + 1].children[0].data;
					var text = singleTrans[i+2].data;
					functions.push({name: name, team: team, text: text, move: move});
				}
				ASYNC.forEachSeries(functions, function(func, funcCB) {
					console.log(func.team + " " + func.move + " " + func.name + " " + func.text);
					callback(funcCB, func.name, func.team, func.text);
				}, function(err) {
					rowCB();
				});
			}
		}
	});
};

var parseESPNTransactions_Move = function(err, dom) {
	parseESPNTransactions(dom, function(rowCB, playerName, team, text) {
		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
			if(player) {
				var textArr = text.split(' ');
				var position = textArr[6];
				player.history[1].fantasy_position = position;
				player.save();
				rowCB();
			}
		});
	});
};

var parseESPNTransactions_Drop = function(err, dom) {
	parseESPNTransactions(dom, function(rowCB, playerName, team) {
		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
			if(player) {
				player.last_team = player.history[0].fantasy_team;
				player.last_dropped = new Date();
				player.history[1].fantasy_team = 'FA';
				player.save();
				rowCB();
			}
		});
	});
};

var parseESPNTransactions_Add = function(err, dom) {
	parseESPNTransactions(dom, function(rowCB, playerName, team) {
		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
			if(player) {
				if(player.last_dropped) {
					var contract_year_retain_cutoff = new Date(player.last_dropped.getTime() + 1*60000);
					var now = new Date();
					if(player.last_team != team || now > contract_year_retain_cutoff) {
						//player.history[0].contract_year = 0;
					}
				}
				player.history[1].fantasy_team = team;
				player.save();
				rowCB();
			}
		});
	});
};

var parseESPNTransactions_All = function(err, dom) {
	parseESPNTransactions(dom, function(rowCB, playerName, team) {
		PLAYER.findOne({name_display_first_last : playerName}, function(err, player) {
			if(player) {
				console.log(playerName + " " + team);
				rowCB();
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

exports.updateESPN = function(pid, callback) {
	getESPNDoc(function(err, dom) {
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
	getESPNDoc(function(err, dom) {
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

///////////
//UTILITIES
///////////

exports.positionToSort = function(pos) {
	switch(pos)
	{
		case "C":
			return 1;
		case "1B":
			return 2;
		case "2B":
			return 3;
		case "3B":
			return 4;
		case "SS":
			return 5;
		case "2B/SS":
			return 6;
		case "1B/3B":
			return 7;
		case "OF":
			return 8;
		case "UTIL":
			return 9;
		case "P":
			return 10;
		case "DL":
			return 11;
		case "Bench":
			return 12;
		default:
			return 100;
	}	
}

var positionToStatus = function(status) {
	switch(status)
	{
		case "C":
		case "1B":
		case "2B":
		case "3B":
		case "SS":
		case "2B/SS":
		case "1B/3B":
		case "OF":
		case "UTIL":
		case "P":
		case "A":
			return "A";
		case "Bench":
		case "MIN":
		case "NRI":
			return "ML";
		case "DL":
		case "D15":
		case "D60":
			return "DL";
		default:
			return "";
	}
}