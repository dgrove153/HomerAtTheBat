var MONGOOSE = require("mongoose");
var CRYPTO = require('crypto');
var USER = require('../models/user');

var watchListSchema = MONGOOSE.Schema({
	team: String,
	player_name: String,
	rank: { type: Number, default: 1000},
	player_id: { type: Number, default: null},
}, { collection: 'watchlist'});

watchListSchema.statics.createNew = function(team, player_name, rank, player_id) {
	var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
	var key = 'password';
	var cipher = CRYPTO.createCipher(algorithm, key);  
	var encryptedName = cipher.update(player_name, 'utf8', 'hex') + cipher.final('hex');
	var player = new Watchlist({
		team: team,
		player_name: encryptedName,
		rank: rank,
		player_id: player_id
	});
	player.save();
}

watchListSchema.statics.getWatchlist = function(req, res, callback) {
	USER.isValidUserPassword(req.user.email, req.body.password, function(nothing, user) {
		if(user) {
			var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
			var key = 'password';
			Watchlist.find({team : req.user.team}, function(err, players) {
				players.forEach(function(encrypted) {
					var decipher = CRYPTO.createDecipher(algorithm, key);
					var decrypted = decipher.update(encrypted.player_name, 'hex', 'utf8') + decipher.final('utf8');	
					encrypted.player_name = decrypted;
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