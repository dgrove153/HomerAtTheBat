var Player = require('./models/player');
var http = require('http');
var mongoose = require('mongoose');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('./config/config')[env];

//Database connection
mongoose.connect(config.db);

Player.remove({});

var ari = function(myVar) {
	for(var i = 0; i < myVar.roster_40.queryResults.row.length; i++) {
		var jsonPlayer = myVar.roster_40.queryResults.row[i];
		var result = Player.findByName(jsonPlayer, function(player, json) {
			if(!player) {
				//create player
				var p = new Player(json);
				p.save(function(err) {
					if(err) console.log(err);
				});
				console.log("Created player: " + json.name_display_first_last);
			} else {
				//update player
				player.history[0].year=2015;
				player.save();
				console.log("Updated player: " + player.name_display_first_last);
			}
		});
	}
};

http.get('http://mlb.mlb.com/lookup/json/named.roster_40.bam?team_id=139', function(res) {
	var output = '';
	res.on('data', function(chunk) {
		output += chunk;
	});
	res.on('end', function() {
		var json = JSON.parse(output);
		ari(json);
	});
});

