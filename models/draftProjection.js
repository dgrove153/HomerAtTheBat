var mongoose = require("mongoose");
var CONFIG = require("../config/config").config();

var batterProjectionSchema = new mongoose.Schema({
	Name: String,
	playerid: Number,
	stats: [{
		source: String,
		PA: Number,
		AB: Number,
	    H: Number,
		"2B": Number,
		"3B": Number,
		HR: Number,
	    R: Number,
	    RBI: Number,
	    BB: Number,
	    SO: Number,
	    HBP: Number,
	    SB: Number,
	    CS: Number,
	    AVG: Number,
	    OBP: Number,
	    SLG: Number,
	    OPS: Number,
	    wOBA: Number,
	    BsR: Number,
	    Fld: Number,
	    WAR: Number
		}
	]
}, { collection: 'batterProjections'});

var DraftProjection = mongoose.model('batterProjections', batterProjectionSchema);
module.exports = DraftProjection;
