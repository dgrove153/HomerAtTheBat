var PLAYER = require('../models/player');
var SELECT = require('soupselect').select;
var HTMLPARSE = require('htmlparser2');
var http = require('http');
var mongoose = require('mongoose');
var ASYNC = require('async');
var BREF = require('../external/bref');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

//var url = 'http://www.baseball-reference.com/players/t/troutmi01.shtml';
//var url = 'http://www.baseball-reference.com/players/c/cabremi01.shtml';
var war = function(err, dom) {
	var datas = SELECT(dom, 'tr[id="batting_value.2013"] td');
	console.log(datas[19].attribs['csk']);
}

// var url = 'http://www.baseball-reference.com/players/';
var charArray = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
var getPlayerCodes = function(err, dom) {
	var blocks = SELECT(dom, 'blockquote');
	blocks.forEach(function(block) {
		var links = SELECT(block, 'a');
		if(links) {
			//links.forEach(function(link) { console.log(link.children[0].data); });
			ASYNC.forEachSeries(links, function(link, cb) {
				var name = link.children[0].data;
				PLAYER.findOne({name_display_first_last : name}, function(err, player) {
					if(player) {
						console.log(name + " " + link.attribs['href']);
						player.bRefUrl = link.attribs['href'];
						player.save();
						cb();
					} else {
						cb();
					}
				});	
			});
		}
	});
}

//charArray.forEach(function(letter) {
	//var charUrl = url + letter + "/";
	// http.get(url,
	// 	function(res) {
	// 		var data;
	// 		res.on('data', function(chunk) {
	// 			data += chunk;
	// 		});
	// 		res.on('end', function() {
	// 			var handler = new HTMLPARSE.DefaultHandler(getPlayerCodes);
	// 			var parser = new HTMLPARSE.Parser(handler);
	// 			parser.parseComplete(data);
	// 		});
	// 	}
	// );
//})

PLAYER.findOne({name_display_first_last : 'Bryce Harper'}, function(err, player) {
	BREF.getBRefPlayerSeason(player, function(season) {
		console.log(season);
	});
})
