var ASYNC = require('async');
var CONFIG = require('../config/config');
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var MOMENT = require('moment');
var SELECT = require('soupselect').select;
var MAILER = require("../util/mailer");

var lookupMinorLeaguer = function(player_id, isHitter, year, callback) {
	if(!player_id) {
		callback(undefined);
		return;
	}
	var url = player_url;
	if (isHitter) {
		url = url.replace('URL_PLAYER_TYPE', 'batting');
	} else {
		url = url.replace('URL_PLAYER_TYPE', 'pitching');
	}
	url = url.replace('URL_YEAR', year);
	url = url.replace('URL_PLAYER_ID', player_id);
	HTTP.get(url + player_id, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			try {
				var json = JSON.parse(output);
				var stats;
				if(isHitter) {
					var career = json.minors_bio_page_batting.minors_stats_batting_career.queryResults.row;
					var bio = json.minors_bio_page_batting.minors_player_info.queryResults.row;
					career.forEach(function(singleResult) {
						if(singleResult.cl == "Minor League Baseball" && singleResult.season == year) {
							stats = singleResult;
						}
						if(singleResult.league_id == bio.league_id) {
							bio.leagueName = singleResult.cl;
						}
					});
				} else {
					var career = json.minors_bio_page_pitching.minors_stats_pitching_career.queryResults.row;
					var bio = json.minors_bio_page_pitching.minors_player_info.queryResults.row;
					career.forEach(function(singleResult) {
						if(singleResult.cl == "Minor League Baseball" && singleResult.season == year) {
							stats = singleResult;
						}
						if(singleResult.league_id == bio.league_id) {
							bio.leagueName = singleResult.cl;
						}
					});
				}
				callback(bio, stats);
			} catch(e) {
				console.log(e);
			}
		});
	});
}

var player_url = 'http://www.milb.com/lookup/json/named.minors_bio_page_URL_PLAYER_TYPE.bam?' + 
	'season=URL_YEAR&' +
	'num_games=10' +
	'&player_id=URL_PLAYER_ID' +
	'&game_type=%27R%27&game_type=%27F%27&game_type=%27D%27&game_type=%27L%27&game_type=%27W%27&' +
	'game_type=%27A%27&game_type=%27S%27&game_type=%27E%27&game_type=%27I%27';

module.exports = {
	lookupMinorLeaguer : lookupMinorLeaguer
}