var CONFIG = require('../config/config').config();
var BATTERPROJECTION = require("../models/draftProjection");
var DRAFTAPP = require("../application/draftProjection");

module.exports = function(app, passport){

	///////////////////
	//DRAFT PROJECTIONS
	///////////////////

	app.get("/draftProjection", function(req, res) {
		var modifiers = { stats: { "$elemMatch" : {}}};
		var queryParams = req.query;
		for(var param in queryParams) {
			if(param == "source") {
				modifiers['stats']["$elemMatch"]['source'] = queryParams[param];
			} else {
				var string = { "$gte" : queryParams[param] };
				console.log(string)
				modifiers['stats']["$elemMatch"][param] = string;
			}
		}
		console.log(modifiers);
		BATTERPROJECTION.find(modifiers, function(err, players) {
			res.send({ count : players.length , players: players });
		});
	});

	app.get("/draftPreview/reset", function(req, res) {
		DRAFTAPP.reset();
		res.send('reset');
	});

	app.get("/draftPreview/init", function(req, res) {
		DRAFTAPP.init();
		res.send('init');
	});

	app.get("/draftPreview", function(req, res) {
		DRAFTAPP.sumStatsForTeam('steamer', function(allPlayers, teams) {
			res.render("draftPreview", {
				players: allPlayers['1'],
				source: 'steamer',
				team: 1,
				teams: teams
			});
		});
	});

	app.post("/draftPreview/player/remove", function(req, res) {
		var playerId = req.body.playerId;
		BATTERPROJECTION.findOne({ playerid : playerId }, function(err, projection) {
			projection.team = undefined;
			projection.save(function() {
				DRAFTAPP.sumStatsForTeam('steamer', function(allPlayers, teams) {
					res.render("partials/projectedStandings", {
						teams: teams
					});
				})
			});
		});
	});
}