var Player = require('../models/player');
var SELECT = require('soupselect').select;
var HTMLPARSE = require('htmlparser2');
var http = require('http');
var mongoose = require('mongoose');
var ASYNC = require('async');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

var url = '';
http.get(url,
	function(res) {
		var data;
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function() {
			var handler = new HTMLPARSE.DefaultHandler(function(err, dom) {});
			var parser = new HTMLPARSE.Parser(handler);
			parser.parseComplete(data);
		});
	}
);