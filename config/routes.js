var User = require('../models/user');
var Auth = require('./authorization');
var Team = require('../team');

module.exports = function(app, passport){
	app.get("/", function(req, res){ 
		if(req.isAuthenticated()){
			res.render("home", { user : req.user}); 
		}else{
			res.render("home", { user : null});
		}
	});

	app.get("/team/:id", Team, function (req, res) {
		res.render("team", { players: req.players } );
	});

	app.get("/login", function(req, res){ 
		res.render("login");
	});

	app.post("/login", 
		passport.authenticate('local', { successRedirect : "/", failureRedirect : "/login",} )
	);

	app.get("/signup", function (req, res) {
		res.render("signup");
	});

	app.post("/signup", Auth.userExist, function (req, res, next) {
		User.signup(req.body.email, req.body.password, function(err, user){
			if(err) throw err;
			req.login(user, function(err){
				if(err) return next(err);
				return res.redirect("profile");
			});
		});
	});

	app.get("/profile", Auth.isAuthenticated , function(req, res){ 
		res.render("profile", { user : req.user});
	});

	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/login');
	});
}
