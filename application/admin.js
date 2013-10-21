var PLAYER = require("../models/player");
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;

exports.updateMLB = function(pid, callback) {
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
					console.log("Couldn't find player with player_id " + pid + " in db.mlbPlayers");
					throw err;
				}
				p.status_code = mlbPlayer.status_code;
				p.team_name = mlbPlayer.team_name;
				p.team_code = mlbPlayer.team_code;
				p.status_code = mlbPlayer.status_code;
				p.position_txt = mlbPlayer.primary_position_txt;
				p.primary_position = mlbPlayer.primary_position;
				p.save();
				callback(p);
			});
		});
	});
}

exports.updateESPN = function(pid, callback) {
	var pid = pid;
	HTTP.get("http://games.espn.go.com/flb/leaguerosters?leagueId=216011", function(espn) {
		var body = '';
		espn.on('data', function(chunk) {
			body += chunk;
		});
		espn.on('end', function() {
			var handler = new HTMLPARSE.DefaultHandler(function(err, dom) {
				var rows = SELECT(dom, 'td#slot_' + pid);
				var status = rows[0].children[0].data
				PLAYER.findOne({espn_player_id:pid}, function(err, p) {
					if(err) {
						console.log("Couldn't find player with espn_player_id " + pid + " in db.mlbPlayers");
						throw err;
					}
					p.fantasy_status_code = positionToStatus(status);
					p.save();
					callback(p);
				});
			});
			var parser = new HTMLPARSE.Parser(handler);
			parser.parseComplete(body);
		});
	});
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
			return "A";
		case "Bench":
			return "ML";
		case "DL":
			return "DL15";
		default:
			return "";
	}
}