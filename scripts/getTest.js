var Player = require('../models/player');
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
var mongoose = require('mongoose');
var ASYNC = require('async');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

var teamHash = {};

// var parseESPNStandingsPage = function(err, dom) {
// 	var table = SELECT(dom, '.tableBody .sortableRow');
// 	table.forEach(function(row) {
// 		var rank = row.children[0].children[0].data;
// 		var name = row.children[1].children[0].children[0].data;
// 		var oldRank;
// 		if(teamHash[name]) {
// 			oldRank = teamHash[name];
// 		}
// 		if(oldRank && oldRank != rank) {
// 			teamHash[name] = rank;
// 		} else if(!oldRank) {
// 			teamHash[name] = rank;
// 		}
// 	});
// }

// var getESPNStandings = function(callback) {
// 	var url = 'http://games.espn.go.com/flb/standings?leagueId=216011&seasonId=2013';
// 	HTTP.get(url, function(res) {
// 		var data;
// 		res.on('data', function(chunk) {
// 			data += chunk;
// 		});
// 		res.on('end', function() {
// 			console.log(data);
// 			var handler = new HTMLPARSE.DefaultHandler(parseESPNStandingsPage);
// 			var parser = new HTMLPARSE.Parser(handler);
// 			parser.parseComplete(data);
// 		});
// 	});
// }

// getESPNStandings();
var TEAM = require('../models/team');
TEAM.getStandings_ESPN();