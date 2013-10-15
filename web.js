//Module dependencies
var 	express = require("express"),
	mongoose = require("mongoose"),
	passport = require("passport"),
	http = require("http"),
	fs = require("fs"),
	flash = require("connect-flash");

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
	app.use(flash());
	app.use(app.router);
});

app.configure('development', function () {
	app.use(express.errorHandler());
});

require('./config/routes')(app, passport);

var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [2];
rule.hour = 0;

var j = schedule.scheduleJob(rule, function(){
    console.log('Today is recognized by Rebecca Black!');
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
