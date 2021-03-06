var ASYNC = require('async');
var CONFIG = require('../config/config');
var HTTP = require('http');
var HTMLPARSE = require('htmlparser2');
var MOMENT = require('moment');
var SELECT = require('soupselect').select;
var MAILER = require("../util/mailer");

//////////////////
//CORE PLAYER INFO
//////////////////

var lookupURL = "http://mlb.com/lookup/json/named.player_info.bam?sport_code='mlb'&player_id=" ;

var lookupPlayer = function(player_id, callback) {
	try {
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
		}).on('error', function(e) {
			callback(undefined);
		});
	} catch(err) {
		callback(undefined);
	}
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
				player_id: mlbPlayer.player_id,
				name_first: mlbPlayer.name_first,
				name_last: mlbPlayer.name_last,
				team_abbrev: mlbPlayer.team_abbrev
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
						'results=' + 'URL_GAMES' + '&game_type=%27R%27&season=' + 'URL_YEAR' +
						'&player_id=' + 'URL_PLAYER_ID' + 
						'&mlb_individual_hitting_last_x_total.col_in=game_date&mlb_individual_hitting_last_x_total.col_in=opp&' +
						'mlb_individual_hitting_last_x_total.col_in=ab&mlb_individual_hitting_last_x_total.col_in=r&' +
						'mlb_individual_hitting_last_x_total.col_in=h&mlb_individual_hitting_last_x_total.col_in=hr&' +
						'mlb_individual_hitting_last_x_total.col_in=rbi&mlb_individual_hitting_last_x_total.col_in=bb&' + 
						'mlb_individual_hitting_last_x_total.col_in=so&mlb_individual_hitting_last_x_total.col_in=sb&' +
						'mlb_individual_hitting_last_x_total.col_in=avg&mlb_individual_hitting_last_x_total.col_in=home_away&' +
						'mlb_individual_hitting_last_x_total.col_in=obp&' +
						'mlb_individual_hitting_last_x_total.col_in=hbp&' +
						'mlb_individual_hitting_last_x_total.col_in=h2b&' +
						'mlb_individual_hitting_last_x_total.col_in=h3b&' +
						'mlb_individual_hitting_last_x_total.col_in=ibb&' +
						'mlb_individual_hitting_last_x_total.col_in=cs&' +
						'mlb_individual_hitting_last_x_total.col_in=sac&' +
						'mlb_individual_hitting_last_x_total.col_in=sf&' +
						'mlb_individual_hitting_last_x_total.col_in=go&' +
						'mlb_individual_hitting_last_x_total.col_in=ao&' +
						'mlb_individual_hitting_last_x_total.col_in=so&' +
						'mlb_individual_hitting_last_x_total.col_in=game_date&' +
						'mlb_individual_hitting_last_x_total.col_in=game_id&mlb_individual_hitting_last_x_total.col_in=game_type';

// var pitcherStats = [
// 	game_date,
// 	opp,
// 	w,
// 	l,
// 	sv,
// 	era,
// 	ip,
// 	h,
// 	er,
// 	bb,
// 	so,
// 	home_away,
// 	whip,
// 	game_id,
// 	game_type,
// 	go,
// 	ao,
// 	hbp
// ];
var pitcher_url = 	'http://mlb.mlb.com/lookup/json/named.mlb_bio_pitching_last_10.bam?' +
						'results=' + 'URL_GAMES' + '&game_type=%27R%27&season=' + 'URL_YEAR' +
						'&player_id=' + 'URL_PLAYER_ID' + 
						'&mlb_individual_pitching_last_x_total.col_in=game_date&mlb_individual_pitching_last_x_total.col_in=opp&' +
						'mlb_individual_pitching_last_x_total.col_in=w&mlb_individual_pitching_last_x_total.col_in=l&' +
						'mlb_individual_pitching_last_x_total.col_in=era&mlb_individual_pitching_last_x_total.col_in=sv&' +
						'mlb_individual_pitching_last_x_total.col_in=ip&mlb_individual_pitching_last_x_total.col_in=h&' +
						'mlb_individual_pitching_last_x_total.col_in=er&mlb_individual_pitching_last_x_total.col_in=bb&' +
						'mlb_individual_pitching_last_x_total.col_in=so&mlb_individual_pitching_last_x_total.col_in=home_away&' +
						'mlb_individual_pitching_last_x_total.col_in=whip&' +
						'mlb_individual_pitching_last_x_total.col_in=game_date&' +
						'mlb_individual_pitching_last_x_total.col_in=game_id&mlb_individual_pitching_last_x_total.col_in=game_type&' +
						'mlb_individual_pitching_last_x_total.col_in=go&' +
						'mlb_individual_pitching_last_x_total.col_in=hbp&' +
						'mlb_individual_pitching_last_x_total.col_in=ao';

var lookupPlayerStats = function(player_id, isHitter, year, games, isGameLog, callback) {
	if(!player_id) {
		callback(undefined);
		return;
	}
	var url = isHitter ? hitter_url : pitcher_url;
	url = url.replace('URL_GAMES', games);
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
				var mlbPlayer;
				if(isHitter) {
					if(isGameLog) {
						mlbPlayer = json.mlb_bio_hitting_last_10.mlb_individual_hitting_game_log.queryResults.row;
					} else {
						mlbPlayer = json.mlb_bio_hitting_last_10.mlb_individual_hitting_last_x_total.queryResults.row;					
					}
				} else {
					if(isGameLog) {
						mlbPlayer = json.mlb_bio_pitching_last_10.mlb_individual_pitching_game_log.queryResults.row;
					} else {
						mlbPlayer = json.mlb_bio_pitching_last_10.mlb_individual_pitching_last_x_total.queryResults.row;
					}
				}
				callback(mlbPlayer);
			} catch(e) {
				console.log(e);
				MAILER.sendError(e);
				callback({});
			}
		});
	});
}

var dailyPitcherUrl = '';

var lookupDailyStats = function(gameday, callback) {
	var url = 'http://gd2.mlb.com/components/game/mlb/' + 
		MOMENT().subtract('hours',6).format('[year_]YYYY[/month_]MM[/day_]DD') + "/gid_" + gameday + "/boxscore.json";
	HTTP.get(url, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			try {
				var json = JSON.parse(output);	
				callback(json.data.boxscore);
			} catch(e) {
				callback(undefined);
			}
		});
	});
}

exports.lookupPlayerStats = lookupPlayerStats;
exports.lookupDailyStats = lookupDailyStats;

////////////////////
//MLB 40-MAN ROSTERS
////////////////////

var rosterUrl = "http://mlb.mlb.com/lookup/json/named.roster_40.bam?team_id=";

var lookupMLBRoster = function(teamId, callback) {
	var url = rosterUrl + teamId;
	HTTP.get(url, function(mlb) {
		var output = '';
		mlb.on('data', function(chunk) {
			output += chunk;
		});
		mlb.on('end', function() {
			var json = JSON.parse(output);
			var roster = json.roster_40.queryResults.row;
			callback(roster);
		});
	});
}

exports.lookupAllRosters = function(callback, playerFunction) {
	ASYNC.forEachSeries(teams, function(team, teamCb) {
		lookupMLBRoster(team.team_id, function(roster) {
			ASYNC.forEachSeries(roster, function(player, playerCb) {
				playerFunction(player, playerCb);
			}, function(err) {
				teamCb();
			});
		});
	}, function() {
		callback();
	});
}

var teams = [
{ team_id: 108, team_code: 'ana', club_full_name : 'Los Angeles Angels' },
{ team_id: 109, team_code: 'ari', club_full_name : 'Arizona Diamondbacks' },
{ team_id: 144, team_code: 'atl', club_full_name : 'Atlanta Braves' },
{ team_id: 110, team_code: 'bal', club_full_name : 'Baltimore Orioles' },
{ team_id: 111, team_code: 'bos', club_full_name : 'Boston Red Sox' },
{ team_id: 112, team_code: 'chn', club_full_name : 'Chicago Cubs' },
{ team_id: 113, team_code: 'cin', club_full_name : 'Cincinnati Reds' },
{ team_id: 114, team_code: 'cle', club_full_name : 'Cleveland Indians' },
{ team_id: 115, team_code: 'col', club_full_name : 'Colorado Rockies' },
{ team_id: 145, team_code: 'cha', club_full_name : 'Chicago White Sox' },
{ team_id: 116, team_code: 'det', club_full_name : 'Detroit Tigers' },
{ team_id: 117, team_code: 'hou', club_full_name : 'Houston Astros' },
{ team_id: 118, team_code: 'kca', club_full_name : 'Kansas City Royals' },
{ team_id: 119, team_code: 'lan', club_full_name : 'Los Angeles Dodgers' },
{ team_id: 146, team_code: 'mia', club_full_name : 'Miami Marlins' },
{ team_id: 158, team_code: 'mil', club_full_name : 'Milwaukee Brewers' },
{ team_id: 142, team_code: 'min', club_full_name : 'Minnesota Twins' },
{ team_id: 121, team_code: 'nyn', club_full_name : 'New York Mets' },
{ team_id: 147, team_code: 'nya', club_full_name : 'New York Yankees' },
{ team_id: 133, team_code: 'oak', club_full_name : 'Oakland Athletics' },
{ team_id: 143, team_code: 'phi', club_full_name : 'Philadelphia Phillies' },
{ team_id: 134, team_code: 'pit', club_full_name : 'Pittsburgh Pirates' },
{ team_id: 135, team_code: 'sdn', club_full_name : 'San Diego Padres' },
{ team_id: 136, team_code: 'sea', club_full_name : 'Seattle Mariners' },
{ team_id: 137, team_code: 'sfn', club_full_name : 'San Francisco Giants' },
{ team_id: 138, team_code: 'sln', club_full_name : 'St. Louis Cardinals' },
{ team_id: 139, team_code: 'tba', club_full_name : 'Tampa Bay Rays' },
{ team_id: 140, team_code: 'tex', club_full_name : 'Texas Rangers' },
{ team_id: 141, team_code: 'tor', club_full_name : 'Toronto Blue Jays' },
{ team_id: 120, team_code: 'was', club_full_name : 'Washington Nationals' }
];

//////////
//SCHEDULE
//////////

exports.getLinescoreInfo = function(gameday, callback) {
	var date = MOMENT().subtract('hours',6).format('[year_]YYYY[/month_]MM[/day_]DD');
	var url = 'http://gd2.mlb.com/components/game/mlb/' + date + '/gid_' + gameday + '/linescore.json';
	HTTP.get(url, function(obj) {
		var output = '';
		obj.on('data', function(chunk) {
			output += chunk;
		});
		obj.on('end', function() {
			var linescore = JSON.parse(output);
			callback(linescore.data.game);
		});
	});
}

exports.getSchedule = function(hoursOffset, callback) {
	var date = MOMENT().subtract('hours',hoursOffset).format('[year_]YYYY[/month_]MM[/day_]DD');
	var url = 'http://gd2.mlb.com/components/game/mlb/' + date + '/master_scoreboard.json';
	HTTP.get(url, function(obj) {
		var output = '';
		obj.on('data', function(chunk) {
			output += chunk;
		});
		obj.on('end', function() {
			var schedule = JSON.parse(output);
			callback(schedule.data.games.game);
		});
	});
}