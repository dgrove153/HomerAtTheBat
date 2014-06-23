var battingCategoryDictionary = {};
battingCategoryDictionary['ab'] = { id: 'ab', biggerIsBetter: 1, display: 'AB', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'batting' };
battingCategoryDictionary['h'] = { id: 'h', biggerIsBetter: 1, display: 'H', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'batting' };
battingCategoryDictionary['h2b'] = { id: 'h2b', biggerIsBetter: 1, display: '2B', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'batting' };
battingCategoryDictionary['h3b'] = { id: 'h3b', biggerIsBetter: 1, display: '3B', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'batting' };
battingCategoryDictionary['hr'] = { id: 'hr', biggerIsBetter: 1, display: 'HR', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'batting espn' };
battingCategoryDictionary['r'] = { id: 'r', biggerIsBetter: 1, display: 'R', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'batting espn' };
battingCategoryDictionary['rbi'] = { id: 'rbi', biggerIsBetter: 1, display: 'RBI', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'batting espn' };
battingCategoryDictionary['sb'] = { id: 'sb', biggerIsBetter: 1, display: 'SB', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'batting espn' };
battingCategoryDictionary['cs'] = { id: 'cs', biggerIsBetter: 0, display: 'CS', numberFormat: "0", multiplier: 1, sortOrder: 'asc', groups: 'batting' };
battingCategoryDictionary['sbp'] = { id: 'sbp', biggerIsBetter: 1, display: 'SB%', numberFormat: "00.0", multiplier: 100, sortOrder: 'desc', groups: 'batting' };
battingCategoryDictionary['obp'] = { id: 'obp', biggerIsBetter: 1, display: 'OBP', numberFormat: ".0000", multiplier: 1, sortOrder: 'desc', groups: 'batting espn' };
battingCategoryDictionary['so_b'] = { id: 'so_b', biggerIsBetter: 0, display: 'K', numberFormat: "0", multiplier: 1, statProperty: 'so', sortOrder: 'asc', groups: 'batting' };
battingCategoryDictionary['bb_b'] = { id: 'bb_b', biggerIsBetter: 1, display: 'BB', numberFormat: "0", multiplier: 1, statProperty: 'bb', sortOrder: 'desc', groups: 'batting' };
battingCategoryDictionary['woba'] = { id: 'woba', biggerIsBetter: 1, display: 'wOBA', numberFormat: ".0000", multiplier: 1, sortOrder: 'desc', groups: 'batting sabr' };
battingCategoryDictionary['babip'] = { id: 'babip', biggerIsBetter: 1, display: 'BABIP', numberFormat: ".0000", multiplier: 1, sortOrder: 'desc', groups: 'batting sabr' };

var pitchingCategoryDictionary = {};
pitchingCategoryDictionary['ip'] = { id : 'ip', biggerIsBetter: 1, display: 'IP', numberFormat: "0.0", multiplier: 1, sortOrder: 'desc', groups: 'pitching', groups: 'pitching' };
pitchingCategoryDictionary['er'] = { id : 'er', biggerIsBetter: 0, display: 'ER', numberFormat: "0", multiplier: 1, sortOrder: 'asc', groups: 'pitching' };
pitchingCategoryDictionary['goao'] = { id : 'goao', biggerIsBetter: 1, display: 'GO/AO', numberFormat: "0.00", multiplier: 1, sortOrder: 'desc', groups: 'pitching' };
pitchingCategoryDictionary['so_p'] = { id: 'so_p', biggerIsBetter : 1, display: 'K', numberFormat: "0", multiplier: 1, statProperty: 'so', sortOrder: 'desc', groups: 'pitching espn' };
pitchingCategoryDictionary['bb_p'] = { id: 'bb_p', biggerIsBetter : 0, display: 'BB', numberFormat: "0", multiplier: 1, statProperty: 'bb', sortOrder: 'asc', groups: 'pitching' };
pitchingCategoryDictionary['kPerNine'] = { id: 'kPerNine', biggerIsBetter : 1, display: 'K/9', numberFormat: "0.00", multiplier: 1, sortOrder: 'desc', groups: 'pitching' };
pitchingCategoryDictionary['kPerWalk'] = { id: 'kPerWalk', biggerIsBetter : 1, display: 'K/BB', numberFormat: "0.00", multiplier: 1, sortOrder: 'desc', groups: 'pitching' };
pitchingCategoryDictionary['whip'] = { id: 'whip', biggerIsBetter : 0, display: 'WHIP', numberFormat: "0.000", multiplier: 1, sortOrder: 'asc', groups: 'pitching espn' };
pitchingCategoryDictionary['era'] = { id: 'era', biggerIsBetter : 0,display: 'ERA',  numberFormat: "0.000", multiplier: 1, sortOrder: 'asc', groups: 'pitching espn' };
pitchingCategoryDictionary['w'] = { id : 'w', biggerIsBetter: 1, display: 'W', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'pitching espn' };
pitchingCategoryDictionary['qs'] = { id: 'qs', biggerIsBetter : 1, display: 'QS', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'pitching' };
pitchingCategoryDictionary['sv'] = { id: 'sv', biggerIsBetter : 1, display: 'SV', numberFormat: "0", multiplier: 1, sortOrder: 'desc', groups: 'pitching espn' };
pitchingCategoryDictionary['kPercentage'] = { id: 'kPercentage', biggerIsBetter : 1, display: 'K%', numberFormat: "0.00", multiplier: 100, sortOrder: 'desc', groups: 'pitching sabr' };
pitchingCategoryDictionary['bbPercentage'] = { id: 'bbPercentage', biggerIsBetter : 0, display: 'BB%', numberFormat: "0.00", multiplier: 100, sortOrder: 'asc', groups: 'pitching sabr' };
pitchingCategoryDictionary['kPMinusbbP'] = { id: 'kPMinusbbP', biggerIsBetter : 1, display: 'K% - BB%', numberFormat: "0.00", multiplier: 100, sortOrder: 'desc', groups: 'pitching sabr' };
pitchingCategoryDictionary['fip'] = { id: 'fip', biggerIsBetter : 0, display: 'FIP', numberFormat: "0.000", multiplier: 1, sortOrder: 'asc', groups: 'pitching sabr' };


var defaultBattingCategories = [ 'hr', 'r', 'rbi', 'sb', 'obp' ];
var defaultPitchingCategories = [ 'so_p', 'whip', 'era', 'w', 'sv' ];

var calculateStandings = function(teams, categories, callback) {
	var battingCategories;
	var pitchingCategories;
	if(categories) {
		battingCategories = categories.battingCategories;
		pitchingCategories = categories.pitchingCategories;
	} else {
		battingCategories = defaultBattingCategories;
		pitchingCategories = defaultPitchingCategories;
	}
	var teamToPoints = {};
	teams.forEach(function(t) {
		teamToPoints[t.teamId] = {};
		teamToPoints[t.teamId]['total'] = 0;
	});
	var includedCategories = { };
	battingCategories.forEach(function(cId) {
		var c = battingCategoryDictionary[cId];
		var display = c.display ? c.display : c.id;
		var statProperty = c.statProperty ? c.statProperty : c.id;
		includedCategories[c.id] = { id : c.id, batting : 1, display : display, statProperty : statProperty };
		teams.sort(function(a, b) {
			if(a.stats.batting[statProperty] > b.stats.batting[statProperty]) {
				if(c.biggerIsBetter) {
					return 1;
				} else {
					return -1;
				}
			}
			if(a.stats.batting[statProperty] < b.stats.batting[statProperty]) {
				if(c.biggerIsBetter) {
					return -1;
				} else {
					return 1;
				}
			}
			return 0;
		});
		for(var points = 1; points <= teams.length; points++) {
			var pointsAllotment = points;
			var tiedTeams = 1;
			while(points < teams.length && teams[points-1].stats.batting[statProperty] == teams[points].stats.batting[statProperty]) {
				tiedTeams++;
				points++;
				pointsAllotment += points;
			}
			var totalTied = tiedTeams;
			while(tiedTeams > 0) {
				teamToPoints[teams[points - tiedTeams].teamId][statProperty] = pointsAllotment / totalTied;
				teamToPoints[teams[points - tiedTeams].teamId]['total'] += pointsAllotment / totalTied;
				tiedTeams--;
			}
		}
	});
	pitchingCategories.forEach(function(cId) {
		var c = pitchingCategoryDictionary[cId];
		var display = c.display ? c.display : c.id;
		var statProperty = c.statProperty ? c.statProperty : c.id;
		includedCategories[c.id] = { id : c.id, pitching : 1, display : display, statProperty : statProperty };
		teams.sort(function(a, b) {
			if(a.stats.pitching[statProperty] > b.stats.pitching[statProperty]) {
				if(c.biggerIsBetter) {
					return 1;
				} else {
					return -1;
				}
			}
			if(a.stats.pitching[statProperty] < b.stats.pitching[statProperty]) {
				if(c.biggerIsBetter) {
					return -1;
				} else {
					return 1;
				}
			}
			return 0;
		});
		//console.log(statProperty);
		for(var points = 1; points <= teams.length; points++) {
			var pointsAllotment = points;
			var tiedTeams = 1;
			while(points < teams.length && teams[points-1].stats.pitching[statProperty] == teams[points].stats.pitching[statProperty]) {
				tiedTeams++;
				points++;
				pointsAllotment += points;
			}
			var totalTied = tiedTeams;
			while(tiedTeams > 0) {
				//console.log("Team: " + teams[points - tiedTeams].fullName + " Points: " + pointsAllotment / totalTied);
				teamToPoints[teams[points - tiedTeams].teamId][statProperty] = pointsAllotment / totalTied;
				teamToPoints[teams[points - tiedTeams].teamId]['total'] += pointsAllotment / totalTied;
				tiedTeams--;
			}
		}
	});
	teams.forEach(function(t) {
		t.standingPoints = teamToPoints[t.teamId];
	});
	teams.sort(function(a, b) {
		if(a.standingPoints.total > b.standingPoints.total) {
			return -1;
		}
		if(a.standingPoints.total < b.standingPoints.total) {
			return 1;
		}
		return 0;
	});
	var dates = { beginDate : teams[0].stats.beginDate, endDate : teams[0].stats.endDate };
	callback(teams, includedCategories, dates);
}

module.exports = {
	calculateStandings : calculateStandings,
	battingCategoryDictionary : battingCategoryDictionary,
	pitchingCategoryDictionary : pitchingCategoryDictionary
}
