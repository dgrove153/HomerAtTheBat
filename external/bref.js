var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
var CONFIG = require('../config/config');

//////////////////
//CORE PLAYER INFO
//////////////////

var bRefHom = 'http://www.baseball-reference.com';

var lookupPlayer = function(player, callback) {
	HTTP.get(bRefHom + player.bRefUrl, function(bRef) {
		var output = '';
		bRef.on('data', function(chunk) {
			output += chunk;
		});
		bRef.on('end', function() {
			var handler = new HTMLPARSE.DefaultHandler(callback);
			var parser = new HTMLPARSE.Parser(handler);
			parser.parseComplete(output);
		});
	});
}

var getBRefPlayerSeason = function(player, callback) {
	console.log("Obtaining Baseball Reference properties for " + player.name_display_first_last);
	var year = CONFIG.isOffseason ? CONFIG.year - 1 : CONFIG.year;
	lookupPlayer(player, function(err, bRefPlayer) {
		if(bRefPlayer == undefined) {
			callback(undefined);
		} else {
			var season = {};
			var datas = SELECT(bRefPlayer, 'tr[id="batting_value.2013"] td');
			season.oWar = datas[19].attribs['csk'];
			callback(season);
		}
	});
}

exports.getBRefPlayerSeason = getBRefPlayerSeason;