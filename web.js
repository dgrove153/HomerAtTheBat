var express = require("express");
var mongojs = require('mongojs');

var app = express();
app.use(express.logger());

var db = mongojs('mongodb://ari:ari@paulo.mongohq.com:10004/app18596138/baseball', ['baseball']);

app.get('/', function(request, response) {
	db.baseball.find({ team: 'GOB' }).sort({salary2013: -1} ,function(err, doc) {
		response.send(doc);
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
