var express = require("express");
var team = require("./team");
var home = require("./home");

var mongoose = require("mongoose");
mongoose.connect('mongodb://ari:ari@paulo.mongohq.com:10004/app18596138/baseball');

var app = express();
app.use(express.logger());
app.set('views', __dirname + '/views');

app.get('/', home.render);
app.get('/team/:id', team.findById);

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
