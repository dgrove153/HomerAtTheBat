var mongoose = require("mongoose");
var schema = require("./schema");

exports.render = function(req, res) {
	schema.Team.find().sort({ fullName: 1}).exec(function(err, doc) {
		res.render('home.jade', { teams: doc});
	});
};
