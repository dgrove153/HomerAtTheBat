var PLAYER = require('../models/player');
var CONFIG = require('../config/config');
var APP = require('../application/app');
var WATCHLIST = require('../models/watchlist');

module.exports = function(app, passport){
	
	////////
	//LOCKUP
	////////

	app.post("/gm/lockup", function(req, res) {
		PLAYER.lockUpPlayer(req.body._id, req.body.salary, function(player, message) {
			req.flash('message', message);
			res.redirect("/gm/keepers/" + player.history[0].fantasy_team);
		});	
	});

	app.post("/gm/lockup/remove", function(req, res) {
		PLAYER.lockUpPlayer_Remove(req.body._id, function(player, message) {
			req.flash('message', message);
			res.redirect("/gm/keepers/" + player.history[0].fantasy_team);
		});
	})

	///////////////
	//MINOR LEAGUER
	///////////////

	app.post("/gm/minorLeaguer/remove", function(req, res) {
		var payload = req.body;
		PLAYER.findOne({_id : payload._id}, function(err, dbPlayer) {
			PLAYER.updatePlayerTeam(dbPlayer, 'FA', CONFIG.year, function() {
				res.send({ result: true })
			});
		})
	});

	///////////
	//WATCHLIST
	///////////

	app.get("/gm/watchlist", APP.isUserLoggedIn, function(req, res) {
		res.render('watchlist', {
			title: 'Watchlist'
		});
	});

	app.post("/gm/watchlist/view", function(req, res) {
		WATCHLIST.getWatchlist(req, res, function(players) {
			var locals = {};
			if(players == undefined) {
				locals.message = "Sorry your password was incorrect."
			} else {
				locals.players = players;
			}
			res.render('partials/watchlistPartial', locals);
		});
	});

	app.post("/gm/watchlist", function(req, res) {
		WATCHLIST.createNew(req.user.team, req.body.player_name, req.body.rank, req.body.player_id);
		res.redirect("/gm/watchlist");
	});

	app.post("/gm/watchlist/remove", function(req, res) {
		WATCHLIST.removePlayer(req.body.encryptedName, function(message) {
			res.send(message);
		});
	});
}
