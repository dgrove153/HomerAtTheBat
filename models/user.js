var mongoose = require("mongoose");
var hash = require('../util/hash');

var userSchema = new mongoose.Schema({
	firstName:  String,
	lastName:   String,
	email:      String,
	salt:       String,
	hash:       String,
	role:	    String,
	team:	    Number,
	lastLogin: 	Date
});

userSchema.statics.signup = function(firstName, lastName, email, password, teamId, done){
	var User = this;
	hash(password, function(err, salt, hash){
		if(err) throw err;
		User.create({
			email : email,
			salt : salt,
			hash : hash,
			firstName: firstName,
			lastName: lastName,
			team: parseInt(teamId)
		}, function(err, user){
			if(err) throw err;
			done(null, user);
		});
	});
}

userSchema.statics.changePassword = function(email, newPassword, done) {
	var User = this;
	hash(newPassword, function(err, salt, hash) {
		if(err) throw err;
		User.findOne({email:email}, function(err, user) {
			user.salt = salt;
			user.hash = hash;
			user.save();

			done("Your password has been updated.");
		});
	});
}

userSchema.statics.isValidUserPassword = function(email, password, done) {
	this.findOne({email : email}, function(err, user){
		// if(err) throw err;
		if(err) return done(err);
		if(!user) return done(null, false, { message : 'Incorrect email.' });
		hash(password, user.salt, function(err, hash){
			if(err) return done(err);
			if(hash == user.hash) return done(null, user);
			done(null, false, {
				message : 'Incorrect password'
			});
		});
	});
};

var User = mongoose.model("User", userSchema);
module.exports = User;
