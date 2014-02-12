var mongoose = require("mongoose");
var CONFIG = require("../config/config").config();

var draftProjectionSchema = new mongoose.Schema({
	Name: String,
	PA: Number,
	"2B": Number,
	"3B": Number,
	HR: Number
}, { collection: 'draftProjections'});

var DraftProjection = mongoose.model('draftProjections', draftProjectionSchema);
module.exports = DraftProjection;
