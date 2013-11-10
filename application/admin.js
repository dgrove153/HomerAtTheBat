var PLAYER = require("../models/player");
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;

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