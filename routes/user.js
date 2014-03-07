var User = require('../models/user');
var TEAM = require('../models/team');
var Auth = require('../config/authorization');

module.exports = function(app, passport){

	app.get("/login", function(req, res){ 
		res.render("login", {
			title: "Log In"
		});
	});

	app.post("/login", function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) { return next(err); }
			if (!user) { return res.redirect('/login'); }
			req.logIn(user, function(err) {
				if (err) { return next(err); }
				User.findOne({email:user.email}, function(err, user) {
					user.lastLogin = new Date();
					user.save();
					return res.redirect('/team/' + user.team);
				});
			});
		})(req, res, next);
	});

	app.get("/signup", function (req, res) {
		res.render("signup");
	});

	app.post("/signup", Auth.userExist, function (req, res, next) {
		User.signup(req.body.firstName, req.body.lastName, req.body.email, req.body.password, req.body.teamId, function(err, user){
			if(err) throw err;
			req.login(user, function(err){
				if(err) return next(err);
				return res.redirect("profile");
			});
		});
	});

	app.get("/profile", Auth.isAuthenticated , function(req, res){ 
		TEAM.findOne({teamId:req.user.team}, function(err, team) {
			var str = req.flash('info');
			res.render("profile", 
				{
					message: str,
					user : req.user,
					team: team,
					title : 'Profile'
				});
		});
	});

	app.post("/user/changePassword", function(req, res){
		User.isValidUserPassword(req.user.email, req.body.old, function(garbage, user) {
			if(!user) {
				req.flash('info', 'The existing password you entered was incorrect');
				res.redirect("/profile");
			}
			else if(req.body.new_pw != req.body.new_confirm || req.body.new_pw.length == 0) {
				req.flash('info', 'The new passwords you entered did not match');
				res.redirect("/profile");
			}
			else {
				User.changePassword(req.user.email, req.body.new_pw, function(message) {
					req.flash('info', message);
					res.redirect("/profile");
				});
			};
		});
	});

	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/login');
	});
}
