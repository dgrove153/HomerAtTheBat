//Module dependencies
var 	express = require("express"),
	mongoose = require("mongoose"),
	passport = require("passport"),
	http = require("http"),
	fs = require("fs"),
	flash = require("connect-flash"),
	TEAM = require("./models/team"),
	relic = require('newrelic');

//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('./config/config')[env];

//Database connection
mongoose.connect(config.db);
mongoose.set('debug', true);

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
	app.use('/public', express.static(__dirname + '/public'));
	app.use(flash());
	app.use(function(req, res, next) {
		res.locals.user = req.user;
		next();
	});
	app.use(TEAM.getList);
	app.use(app.router);
});

app.configure('development', function () {
	app.use(express.errorHandler());
});

var server = http.createServer(app);
server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

// var io = require('socket.io').listen(server);
// io.sockets.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });

var routes_dir = __dirname + '/routes';
fs.readdirSync(routes_dir).forEach(
	function (file) {
		if(file[0] === '.') return;
		if(file.indexOf("~") != -1) return;  
		require(routes_dir+'/'+ file)(app, passport);
	}
);