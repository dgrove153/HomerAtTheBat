var User = require('../models/user');
var Auth = require('../config/authorization');
var Team = require('../models/team');
var nodemailer = require('nodemailer');
var Player = require('../models/player');
var Config = require('../config/config');
var Vulture = require("../application/vulture");

module.exports = function(app, passport){
	app.get("/", Team.getList, function(req, res){ 
		if(req.isAuthenticated()){
			console.log(req.session);
			res.render("home", { teams: req.teamList }); 
		}else{
			res.render("home", { session: req.session, teams: req.teamList });
		}
	});
}
