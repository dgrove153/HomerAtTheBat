var mongojs = require('mongojs');
var db = mongojs('mongodb://ari:ari@paulo.mongohq.com:10004/app18596138/baseball', ['baseball']);

exports.findById = function(req, res) {
	var id = req.params.id;
	var findQuery = { team : id };
	db.baseball.find(findQuery).sort({salary2013: -1} ,function(err, doc) {
		res.send(doc);
	});
};
