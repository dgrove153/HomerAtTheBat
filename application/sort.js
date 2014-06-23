var CONSTANTS = require("./constants");

var sortToFantasyPositions = function(players) {
	var sortedPlayers = {};

	sortedPlayers.catchers = [];
	sortedPlayers.first_base = [];
	sortedPlayers.second_base = [];
	sortedPlayers.third_base = [];
	sortedPlayers.shortstop = [];
	sortedPlayers.middle_infield = [];
	sortedPlayers.corner_infield = [];
	sortedPlayers.outfielders = [];
	sortedPlayers.utility = [];
	sortedPlayers.pitchers = [];
	sortedPlayers.minor_leaguers = [];
	sortedPlayers.dl = [];
	sortedPlayers.bench = [];

	for(var i = 0; i < players.length; i++) {
		var player = players[i];
		var position = player.history[player.history_index].fantasy_position;
		var posText = undefined;
		switch(position)
		{
			case CONSTANTS.FantasyPosition.Catcher:
				posText = 'catchers';
				break;
			case CONSTANTS.FantasyPosition.FirstBase:
				posText = 'first_base';
				break;
			case CONSTANTS.FantasyPosition.SecondBase:
				posText = 'second_base';
				break;
			case CONSTANTS.FantasyPosition.ThirdBase:
				posText = 'third_base';
				break;
			case CONSTANTS.FantasyPosition.Shortstop:
				posText = 'shortstop';
				break;
			case CONSTANTS.FantasyPosition.MiddleInfield:
				posText = 'middle_infield';
				break;
			case CONSTANTS.FantasyPosition.CornerInfield:
				posText = 'corner_infield';
				break;
			case CONSTANTS.FantasyPosition.Outfield:
				posText = 'outfielders';
				break;
			case CONSTANTS.FantasyPosition.Utility:
				posText = 'utility';
				break;
			case CONSTANTS.FantasyPosition.Pitcher:
				posText = 'pitchers';
				break;
			case CONSTANTS.FantasyPosition.DisabledList:
				posText = 'dl';
				break;
			case CONSTANTS.FantasyPosition.Minors:
				posText = 'minor_leaguers';
				break;
			case CONSTANTS.FantasyPosition.Bench:
				posText = 'bench';
				break;
			default:
				posText = 'bench';
		}
		sortedPlayers[posText].push(players[i]);	
	}
	sortedPlayers['minor_leaguers'].sort(sortMinorLeaguers);
	sortedPlayers['pitchers'].sort(alphabeticalSort);
	sortedPlayers['outfielders'].sort(alphabeticalSort);
	sortedPlayers['dl'].sort(alphabeticalSort);
	sortedPlayers['bench'].sort(alphabeticalSort);
	sortedPlayers['catchers'].sort(alphabeticalSort);
	return sortedPlayers;
};

var sortMinorLeaguers = function(a, b) {
	if(a.primary_position == 1 && b.primary_position != 1) {
		return 1;
	} else if(a.primary_position != 1 && b.primary_position == 1) {
		return -1;
	} else if (a.primary_position == 1 && b.primary_position == 1) {
		return alphabeticalSort(a, b);
	} else if(a.primary_position != 1 && b.primary_position != 1) {
		if(a.primary_position < b.primary_position) {
			return -1;
		} else if(a.primary_position > b.primary_position) {
			return 1;
		} else {
			return alphabeticalSort(a, b);
		}
	} else {
		return -1;
	}
}

var alphabeticalSort = function(a,b) {
	if(a.name_last > b.name_last) {
		return 1;
	} else if(a.name_last < b.name_last) {
		return -1;
	} else {
		if(a.name_first > b.name_first) {
			return 1;
		} else if(a.name_first < b.name_first) {
			return -1;
		} else {
			return 1;
		}
	}
}

module.exports = {
	sortToFantasyPositions : sortToFantasyPositions,
	sortMinorLeaguers : sortMinorLeaguers
}