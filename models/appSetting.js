var MONGOOSE = require("mongoose");
var CONFIG = require('../config/config');

var appSettingSchema = MONGOOSE.Schema({
	name: String,
	description: String,
	value: String
}, { collection: 'appSetting'});

appSettingSchema.statics.createNew = function(name, description, value, callback) {
	var newAppSetting = new AppSetting();
	newAppSetting.name = name;
	newAppSetting.description = description;
	newAppSetting.value = value;
	newAppSetting.save(function(err, as) {
		callback(as);
	});
};

var AppSetting = MONGOOSE.model('AppSetting', appSettingSchema);
module.exports = AppSetting;