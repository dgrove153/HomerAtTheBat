var mongoose = require("mongoose");

exports.render = function(req, res) {
	var Team = mongoose.model('Team');
	Team.find().sort({ fullName: 1}).exec(function(err, doc) {
		res.render('home.jade', { teams: doc});
	});
};
