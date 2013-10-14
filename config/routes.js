var User = require('../models/user');
var Auth = require('./authorization');
var Team = require('../models/team');
var nodemailer = require('nodemailer');

module.exports = function(app, passport){
	app.get("/", function(req, res){ 
		if(req.isAuthenticated()){
			res.render("home", { user : req.user}); 
		}else{
			res.render("home", { user : null});
		}
	});

	app.get("/team/:id", Team.getInfo, Team.getPlayers, function (req, res) {
		res.render("team", { players: req.players, team: req.team, user: req.user } );
	});

	app.get("/login", function(req, res){ 
		res.render("login");
	});

	app.post("/login", function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) { return next(err); }
			if (!user) { return res.redirect('/login'); }
			req.logIn(user, function(err) {
				if (err) { return next(err); }
				return res.redirect('/team/' + user.team);
			});
		})(req, res, next);
	});

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

	app.get("/admin", Auth.isAdmin, function(req, res) {
		res.render("admin");
	});

	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/login');
	});

	app.get('/mailer', function(req, res) {
		// create reusable transport method (opens pool of SMTP connections)
		var smtpTransport = nodemailer.createTransport("SMTP",{
		    service: "Gmail",
		    auth: {
			user: "homeratthebat@gmail.com",
			pass: "fantasybaseball"
		    }
		});

		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: "Ari Golub",
		    to: "arigolub@gmail.com", // list of receivers
		    subject: "Hello", // Subject line
		    text: "Hello world", // plaintext body
		}

		// send mail with defined transport object
		smtpTransport.sendMail(mailOptions, function(error, response){
		    if(error){
			console.log(error);
		    }else{
			console.log("Message sent: " + response.message);
		    }

		    // if you don't want to use this transport object anymore, uncomment following line
		    smtpTransport.close(); // shut down the connection pool, no more messages
		});

		res.send('sent');
	});

	app.post("/services/keeper", function(req, res) {
		Team.updateKeepers(req.body);
		res.send("worked");
	});
}
