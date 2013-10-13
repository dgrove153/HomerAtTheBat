//Module dependencies
var 	express = require("express"),
	mongoose = require("mongoose"),
	passport = require("passport"),
	http = require("http"),
	fs = require("fs");

//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('./config/config')[env];

//Database connection
mongoose.connect(config.db);

var models_dir = __dirname + '/models';
fs.readdirSync(models_dir).forEach(
	function (file) {
		if(file[0] === '.') return;
		if(file.indexOf("~") != -1) return;  
		require(models_dir+'/'+ file);
	}
);

//Passport setup
require('./config/passport')(passport);

//Express
var app = express();
app.configure(function() {
	app.set('port', process.env.PORT || 5000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'SECRET' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.methodOverride());
	app.use(app.router);
});

app.configure('development', function () {
	app.use(express.errorHandler());
});

var LocalStrategy = require('passport-local').Strategy
var User = mongoose.model('User');

passport.use(new LocalStrategy(function(username, password, done) {
	User.findOne({ username : username},function(err,user){
        	if(err) { return done(err); }
		if(!user){
            		return done(null, false, { message: 'Incorrect username.' });
        	}

        	hash( password, user.salt, function (err, hash) {
            		if (err) { return done(err); }
			if (hash == user.hash) return done(null, user);
			done(null, false, { message: 'Incorrect password.' });
		});
	});
}));

require('./config/routes')(app, passport);

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
