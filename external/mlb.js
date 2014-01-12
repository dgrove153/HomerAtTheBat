var PLAYER = require("../models/player");
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;

var lookupURL = "http://mlb.com/lookup/json/named.player_info.bam?sport_code='mlb'&player_id=" ;

var lookupPlayer = function(player_id, callback) {
	HTTP.get(lookupURL + player_id, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			var json = JSON.parse(output);
			var mlbPlayer = json.player_info.queryResults.row;
			callback(mlbPlayer);
		});
	});
}

var getMLBProperties = function(player_id, callback) {
	console.log("Obtaining MLB properties for " + player_id);
	lookupPlayer(player_id, function(mlbPlayer) {
		if(mlbPlayer == undefined) {
			callback(undefined);
		} else {
			var mlbProperties = {
				name_display_first_last: mlbPlayer.name_display_first_last,
				position_txt: mlbPlayer.position_txt,
				primary_position: mlbPlayer.primary_position,
				status_code: mlbPlayer.status_code,
				team_code: mlbPlayer.team_code,
				team_id: mlbPlayer.team_id,
				team_name: mlbPlayer.team_name,
				player_id: mlbPlayer.player_id
			};
			callback(mlbProperties);
		}
	});
}

exports.getMLBProperties = getMLBProperties;

exports.updateMLB_ALL = function(callback) {
	var count = 0;
	PLAYER.find({}, function(err, docs) {
		for(var i = 0; i < docs.length; i++) {
			if(docs[i].player_id != undefined) {
				console.log("updating " + docs[i].name_display_first_last);
				MLB.getMLBProperties(docs[i].player_id, function(mlbPlayer) {
					PLAYER.updatePlayer_MLB(mlbPlayer, function(player) {
						count++;
					});
				});
			}
		}
		callback('updating');
	});
}