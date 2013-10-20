var mongoose = require("mongoose");
var Player = require("../models/player");
var Team = require("../models/team");
var http = require('http');
var htmlparse = require('htmlparser2');
var select = require('soupselect').select;

exports.preprocessVulture = function(req, res, next) {
	Player.findOne({player_id: req.params.pid}, function(err, player) {
		if(err) throw err;
		req.player = player;
		if(player.vulture.is_vultured == false) {
			req.allowVulture = true;
		} else {
			req.allowVulture = false;	
		}
		next();
	});
};

exports.submitVulture = function(req, res, next) {
	Player.findOne({player_id: req.params.pid}, function(err, doc) {
		var vulture_player = doc;
		Player.findOne({player_id: req.body.removingPlayer}, function(err, doc) {
			var removing_player = doc;
			createVulture(req, vulture_player, removing_player);
			next();
		});
	});
};

var createVulture = function(req, vulture_player, removed_player) {
	var vulture_valid = false;
	var remove_valid = false;

	if(vulture_player.vulture == undefined || vulture_player.vulture.is_vultured == false) {
		vulture_player.vulture.is_vultured = true;
		vulture_player.vulture.vulture_team = req.user.team;
		var deadline = new Date();
		vulture_player.vulture.deadline = deadline.setDate(deadline.getDate() + 1);
		console.log(vulture_player.deadline);
		vulture_valid = true;
	}

	if(removed_player.vulture == undefined || (removed_player.vulture.is_vultured == false && removed_player.vulture.vultured_for_pid == undefined)) {
		removed_player.vulture.vultured_for_pid = vulture_player.player_id;
		remove_valid = true;
	}

	if(remove_valid && vulture_valid) {
		vulture_player.save();
		removed_player.save();
		req.message = "vulture successful";
	} else {
		req.message = "failed vulture";	
	}

};

exports.getVulturesForTeam = function(req, res, next) {
	if(req.user != null ) {
		Player.find({fantasy_team: req.user.team, 'vulture.is_vultured':true}, function(err, doc) {
			req.open_vultures = doc;
			next();
		});
	} else {
		req.open_vultures = [];
		next();
	}
}

var markNotVultured = function(player) {
	player.vulture.deadline = undefined;
	player.vulture.is_vultured = false;
	player.vulture.vulture_team = undefined;
}

exports.verifyWithMLB = function(pid, res) {
	http.get("http://mlb.com/lookup/json/named.player_info.bam?sport_code='mlb'&player_id=" + pid, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			var json = JSON.parse(output);
			var mlbPlayer = json.player_info.queryResults.row;
			var player = Player.findOne({player_id: pid}, function(err, p) {
				if(err) throw err;
				p.status_code = mlbPlayer.status_code;
				if(p.status_code == p.fantasy_status_code) {
					markNotVultured(p);
				}
				p.save();
				res.send('updated');
			});
		});
	});
};

exports.verifyWithESPN = function(pid, res) {
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
					console.log("Name: " + playerRow.children[0].next.children[0].children[0].data + 
						", Status: " + playerRow.children[0].children[0].data);
				}
			});
			var parser = new htmlparse.Parser(handler);
			parser.parseComplete(body);
			res.send('finished');
		});
	});
};


var updatePlayer = function(playerRow) {
	var playerName = playerRow.children[0].next.children[0].children[0].data;
	Player.findOne({name_display_first_last: playerName}, function(err, dbPlayer) {
		if(!dbPlayer) {
			console.log("Couldn't find " + playerName);
		} else { 
			//console.log("Name: " + playerName);
			var playerId = playerRow.children[0].next.children[0].attribs.playerid;
			dbPlayer.espn_player_id = playerId;
			//console.log("ESPN Player Id: " + playerId);
			dbPlayer.save();
		}
	});	
}

exports.getEspnIds = function(res) {
	http.get("http://games.espn.go.com/flb/leaguerosters?leagueId=216011", function(espn) {
		var body = '';
		espn.on('data', function(chunk) {
			body += chunk;
		});
		espn.on('end', function() {
			var handler = new htmlparse.DefaultHandler(function(err, dom) {
				var rows = select(dom, 'tr.pncPlayerRow');
				for(var i = 0; i < rows.length; i++) {
					var playerRow = rows[i];
					if(playerRow.children[0].next.children[0].children != undefined) {
						updatePlayer(playerRow);
					}
				}
				res.send('finished');
			});
			var parser = new htmlparse.Parser(handler);
			parser.parseComplete(body);
		});
	});
};