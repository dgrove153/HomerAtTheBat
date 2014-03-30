var mongoose = require("mongoose");
var ASYNC = require('async');
var MOMENT = require("moment");
var MLB = require("../external/mlb");


var mlbGameSchema = new mongoose.Schema({
	awayTeamCity: String,
	awayTeamName: String,
	awayTeamId: Number,
	awayNameAbbrev: String,
	awayScore: Number,
	awayProbablePitcherId: Number,
	homeTeamCity: String,
	homeTeamName: String,
	homeNameAbbrev: String,
	homeTeamId: Number,
	homeScore: Number,
	homeProbablePitcherId: Number,
	timeDate: Date,
	status: String,
	inning: String,
	inningState: String,
	gameday: String
}, { collection: 'mlbGame'});

mlbGameSchema.statics.createNew = function(json, callback) {
	var game = new MlbGame();
	game.awayTeamCity = json.away_team_city;
	game.awayTeamName = json.away_team_name;
	game.awayNameAbbrev = json.away_name_abbrev;
	game.awayTeamId = json.away_team_id;
	game.homeTeamCity = json.home_team_city;
	game.homeTeamName = json.home_team_name;
	game.homeNameAbbrev = json.home_name_abbrev;
	game.homeTeamId = json.home_team_id;
	game.timeDate = json.time_date;
	game.status = json.status.status;
	game.inning = json.status.inning;
	game.inningState = json.status.inning_state;
	if(json.away_probable_pitcher) {
		game.awayProbablePitcherId = json.away_probable_pitcher.id;	
	}
	if(json.home_probable_pitcher) {
		game.homeProbablePitcherId = json.home_probable_pitcher.id;	
	}
	if(json.linescore) {
		game.awayScore = json.linescore.r.away;
		game.homeScore = json.linescore.r.home;
	}
	game.gameday = json.gameday;
	game.save(function() {
		callback();
	});
}

var hoursOffset = 6;

var fetchSchedule = function(callback) {
	MLB.getSchedule(hoursOffset, function(jsonGames) {
		if(jsonGames) {
			ASYNC.forEachSeries(jsonGames, function(g, cb) {
				MlbGame.createNew(g, cb);
			}, function() {
				MlbGame.find({}, function(err, games) {
					callback(games);
				});
			});
		} else {
			callback([]);
		}
	});
}

mlbGameSchema.statics.getTodaysSchedule = function(callback) {
	MlbGame.find({}, function(err, games) {
		if(games.length == 0) {
			fetchSchedule(callback);
		} else {
			var game = games[0];
			var now = MOMENT().subtract('hours', hoursOffset).format('MM DD YYYY');
			var gameDate = MOMENT(game.timeDate).format('MM DD YYYY');
			if(now == gameDate) {
				callback(games);
			} else {
				MlbGame.remove({}, function() {
					fetchSchedule(callback);
				});
			}
		}
	});
}

var MlbGame = mongoose.model('mlbGame', mlbGameSchema);
module.exports = MlbGame;