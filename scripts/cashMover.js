var Cash = require('../models/cash');
var mongoose = require('mongoose');
//Environment variables
var 	env = process.env.NODE_ENV || 'development';
var 	config = require('../config/config').setUpEnv(env).config();

//Database connection
mongoose.connect(config.db);

var team = 2;
var year = 2015;
var type = 'MLB';
var amount = 8;

Cash.find({ team: team, year: year, type: type}, function(err, docs) {
	console.log(docs);
});


