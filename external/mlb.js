var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var SELECT = require('soupselect').select;
var CONFIG = require('../config/config');

//////////////////
//CORE PLAYER INFO
//////////////////

var lookupURL = "http://mlb.com/lookup/json/named.player_info.bam?sport_code='mlb'&player_id=" ;

var lookupPlayer = function(player_id, callback) {
	HTTP.get(lookupURL + player_id, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			var json = JSON.parse(output);
			var mlbPlayer = json.player_info.queryResults.row;
			callback(mlbPlayer);
		});
	});
}

var getMLBProperties = function(player_id, callback) {
	console.log("Obtaining MLB properties for " + player_id);
	lookupPlayer(player_id, function(mlbPlayer) {
		if(mlbPlayer == undefined) {
			callback(undefined);
		} else {
			var mlbProperties = {
				name_display_first_last: mlbPlayer.name_display_first_last,
				position_txt: mlbPlayer.primary_position_txt,
				primary_position: mlbPlayer.primary_position,
				status_code: mlbPlayer.status_code,
				team_code: mlbPlayer.team_code,
				team_id: mlbPlayer.team_id,
				team_name: mlbPlayer.team_name,
				player_id: mlbPlayer.player_id
			};
			callback(mlbProperties);
		}
	});
}

exports.getMLBProperties = getMLBProperties;

/////////////////
//GAME STATISTICS
/////////////////

var hitter_url = 	'http://mlb.mlb.com/lookup/json/named.mlb_bio_hitting_last_10.bam?' +
						'results=200&game_type=%27R%27&season=' + 'URL_YEAR' +
						'&player_id=' + 'URL_PLAYER_ID' + 
						'&mlb_individual_hitting_last_x_total.col_in=game_date&mlb_individual_hitting_last_x_total.col_in=opp&' +
						'mlb_individual_hitting_last_x_total.col_in=ab&mlb_individual_hitting_last_x_total.col_in=r&' +
						'mlb_individual_hitting_last_x_total.col_in=h&mlb_individual_hitting_last_x_total.col_in=hr&' +
						'mlb_individual_hitting_last_x_total.col_in=rbi&mlb_individual_hitting_last_x_total.col_in=bb&' + 
						'mlb_individual_hitting_last_x_total.col_in=so&mlb_individual_hitting_last_x_total.col_in=sb&' +
						'mlb_individual_hitting_last_x_total.col_in=avg&mlb_individual_hitting_last_x_total.col_in=home_away&' +
						'mlb_individual_hitting_last_x_total.col_in=obp&' +
						'mlb_individual_hitting_last_x_total.col_in=game_id&mlb_individual_hitting_last_x_total.col_in=game_type';

var pitcher_url = 	'http://mlb.mlb.com/lookup/json/named.mlb_bio_pitching_last_10.bam?' +
						'results=100&game_type=%27R%27&season=' + 'URL_YEAR' +
						'&player_id=' + 'URL_PLAYER_ID' + 
						'&mlb_individual_pitching_last_x_total.col_in=game_date&mlb_individual_pitching_last_x_total.col_in=opp&' +
						'mlb_individual_pitching_last_x_total.col_in=w&mlb_individual_pitching_last_x_total.col_in=l&' +
						'mlb_individual_pitching_last_x_total.col_in=era&mlb_individual_pitching_last_x_total.col_in=sv&' +
						'mlb_individual_pitching_last_x_total.col_in=ip&mlb_individual_pitching_last_x_total.col_in=h&' +
						'mlb_individual_pitching_last_x_total.col_in=er&mlb_individual_pitching_last_x_total.col_in=bb&' +
						'mlb_individual_pitching_last_x_total.col_in=so&mlb_individual_pitching_last_x_total.col_in=home_away&' +
						'mlb_individual_pitching_last_x_total.col_in=whip&' +
						'mlb_individual_pitching_last_x_total.col_in=game_id&mlb_individual_pitching_last_x_total.col_in=game_type';

var lookupPlayerStats = function(player_id, isHitter, year, callback) {
	if(!player_id) {
		callback(undefined);
		return;
	}
	var url = isHitter ? hitter_url : pitcher_url;
	url = url.replace('URL_YEAR', year);
	url = url.replace('URL_PLAYER_ID', player_id);
	HTTP.get(url + player_id, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			var json = JSON.parse(output);
			var mlbPlayer;
			if(isHitter) {
				mlbPlayer = json.mlb_bio_hitting_last_10.mlb_individual_hitting_last_x_total.queryResults.row;
			} else {
				mlbPlayer = json.mlb_bio_pitching_last_10.mlb_individual_pitching_last_x_total.queryResults.row;
			}
			callback(mlbPlayer);
		});
	});
}

exports.lookupPlayerStats = lookupPlayerStats;