var mongoose = require("mongoose");
var Player = require("../models/player");
var http = require('http');
var htmlparse = require('htmlparser2');
var select = require('soupselect').select;

var updatePlayer = function(playerRow) {
	var playerName = playerRow.children[0].next.children[0].children[0].data;
	Player.findOne({name_display_first_last: playerName}, function(err, dbPlayer) {
		var playerId = playerRow.children[0].next.attribs.playerid;
		dbPlayer.espn_player_id = playerId;
		console.log("Name: " + playerName + 
		", ESPN Player Id: " + playerId);
	});
}

http.get("http://games.espn.go.com/flb/leaguerosters?leagueId=216011", function(espn) {
	var body = '';
	espn.on('data', function(chunk) {
		body += chunk;
	});
	espn.on('end', function() {
		var handler = new htmlparse.DefaultHandler(function(err, dom) {
			var rows = select(dom, 'tr.pncPlayerRow#plyr703');
			for(var i = 0; i < rows.length; i++) {
				var playerRow = rows[i];
				updatePlayer(playerRow);
			}
		});
		var parser = new htmlparse.Parser(handler);
		parser.parseComplete(body);
		res.send('finished');
	});
});