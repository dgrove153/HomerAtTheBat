var Player = require('../models/player');
var SELECT = require('soupselect').select;
var HTMLPARSE = require('htmlparser2');
var http = require('http');
var mongoose = require('mongoose');
var ASYNC = require('async');
var csv = require('express-csv')
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
//mongoose.connect(config.db);

var jeff = function(outerRes) {
	var url = 'http://streak.espn.go.com/en/group?groupID=235811&entryID=5172785';
	http.get(url,
		function(res) {
			var data;
			res.on('data', function(chunk) {
				data += chunk;
			});
			res.on('end', function() {
				var handler = new HTMLPARSE.DefaultHandler(function(err, dom) {
					var table = SELECT(dom, 'div#groupTable');
					var rows = SELECT(table, 'tr');
					var resultArray = [];
					rows.forEach(function(row) {
						var entry = SELECT(row, 'a.entry');
						var name = SELECT(row, 'a.profileLink');
						if(entry[0] && entry[0].children && name[0] && name[0].children) {
							var user = name[0].children[0].data;
							var entry = entry[0].children[0].data;
							var currStreak = row.children[1].children[0].data;
							var longStreak = row.children[2].children[0].data;
							var monthStreak = row.children[3].children[0].data;
							var pct = row.children[4].children[0].children[0].data;
							var record = row.children[4].children[2].children[0].data;
							var singleResult = { 
								user: user,
								entry: entry,
								currStreak: currStreak,
								longStreak: longStreak,
								monthStreak: monthStreak,
								pct: pct,
								record: record
							};
							resultArray.push(singleResult);
						}
					});
					outerRes.csv(resultArray);
				});
				var parser = new HTMLPARSE.Parser(handler);
				parser.parseComplete(data);
			});
		}
	);
}

exports.jeff = jeff;