var MONGOOSE = require("mongoose");
var CRYPTO = require('crypto');
var USER = require('../models/user');

var watchListSchema = MONGOOSE.Schema({
	team: String,
	player_name: String,
	rank: { type: Number, default: null},
	player_id: { type: String, default: null},
}, { collection: 'watchlist'});

watchListSchema.statics.createNew = function(team, player_name, rank, player_id) {
	var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
	var key = 'password' + team;
	var cipher = CRYPTO.createCipher(algorithm, key);  
	var encryptedName = cipher.update(player_name, 'utf8', 'hex') + cipher.final('hex');
	var encryptedId;
	if(player_id) {
		player_id_string = "" + player_id;
		console.log("PLAYER STRING: " + player_id_string);
		var cipher2 = CRYPTO.createCipher(algorithm, key);  
		encryptedId = cipher2.update(player_id_string, 'utf8', 'hex') + cipher2.final('hex');	
	}
	var player = new Watchlist({
		team: team,
		player_name: encryptedName,
		rank: rank,
		player_id: encryptedId
	});
	player.save();
}

watchListSchema.statics.removePlayer = function(encryptedName, callback) {
	Watchlist.findOne({player_name : encryptedName}, function(err, player) {
		if(player) {
			player.remove();
			callback('Player removed');
		} else {
			callback('Sorry, player not found.');
		}
	});
}

watchListSchema.statics.getWatchlist = function(req, res, callback) {
	USER.isValidUserPassword(req.user.email, req.body.password, function(nothing, user) {
		if(user) {
			var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
			var key = 'password' + req.user.team;
			Watchlist.find({team : req.user.team}).sort({rank: 1}).exec(function(err, players) {
				players.forEach(function(encrypted) {
					var decipher = CRYPTO.createDecipher(algorithm, key);
					var decrypted = decipher.update(encrypted.player_name, 'hex', 'utf8') + decipher.final('utf8');	
					encrypted.encryptedName = encrypted.player_name;
					encrypted.player_name = decrypted;
					if(encrypted.player_id) {
						var decipher2 = CRYPTO.createDecipher(algorithm, key);
						var decryptedId = decipher2.update(encrypted.player_id, 'hex', 'utf8') + decipher2.final('utf8');	
						encrypted.player_id = decryptedId;
					}
				});
				callback(players);
			})
		} else {
			callback(undefined);
		}
	});
}

var Watchlist = MONGOOSE.model('Watchlist', watchListSchema);
module.exports = Watchlist;