var mongoose = require("mongoose");
var Player = require("../models/player");
var http = require('http');
var htmlparse = require('htmlparser2');
var select = require('soupselect').select;

//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);
mongoose.set('debug', true);

var count = 0;

var updatePlayer = function(playerRow) {
	var id = playerRow.children[0].attribs.playerid;
	var name = playerRow.children[0].children[0].data;
	Player.findOne({name_display_first_last: name}, function(err, dbPlayer) {
		if(dbPlayer != null) {
			console.log(name + ": " + id);
			var pid = parseInt(id);
			dbPlayer.espn_player_id = pid;
			dbPlayer.save();
			count++;
			console.log(count);
		}
	});
}

http.get("http://games.espn.go.com/flb/leaguerosters?leagueId=216011", function(espn) {
	var body = '';
	espn.on('data', function(chunk) {
		body += chunk;
	});
	espn.on('end', function() {
		var handler = new htmlparse.DefaultHandler(function(err, dom) {
			var rows = select(dom, 'tr.pncPlayerRow td.playertablePlayerName');
			for(var i = 0; i < rows.length; i++) {
				var playerRow = rows[i];
				updatePlayer(playerRow);
			}
		});
		var parser = new htmlparse.Parser(handler);
		parser.parseComplete(body);
		//res.send('finished');
	});
});