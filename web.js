var express = require("express");
var team = require("./team");

var app = express();
app.use(express.logger());

app.get('/', function(request, response) {
	response.send('ok');
});
app.get('/team/:id', team.findById);

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
