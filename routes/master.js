var User = require('../models/user');
var Auth = require('../config/authorization');
var Team = require('../models/team');
var nodemailer = require('nodemailer');
var Player = require('../models/player');
var Asset = require('../models/asset');
var Config = require('../config/config');
var Vulture = require("../application/vulture");

module.exports = function(app, passport){
	app.get("/", Team.getList, function(req, res){ 
		if(req.isAuthenticated()){
			res.render("home", { user : req.user, teams: req.teamList }); 
		}else{
			res.render("home", { user : null, teams: req.teamList });
		}
	});

	app.get("/fixvulture/:pid", function(req, res) {
		Vulture.verifyWithMLB(req.params.pid, res);
	});

	app.get("/espn", function(req, res) {
		Vulture.getEspnIds(res);
	});
}
