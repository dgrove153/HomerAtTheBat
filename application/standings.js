var battingCategoryDictionary = {};
battingCategoryDictionary['ab'] = { id: 'ab', biggerIsBetter: 1 };
battingCategoryDictionary['h'] = { id: 'h', biggerIsBetter: 1 };
battingCategoryDictionary['h2b'] = { id: 'h2b', biggerIsBetter: 1 };
battingCategoryDictionary['h3b'] = { id: 'h3b', biggerIsBetter: 1 };
battingCategoryDictionary['hr'] = { id: 'hr', biggerIsBetter: 1 };
battingCategoryDictionary['r'] = { id: 'r', biggerIsBetter: 1 };
battingCategoryDictionary['rbi'] = { id: 'rbi', biggerIsBetter: 1 };
battingCategoryDictionary['sb'] = { id: 'sb', biggerIsBetter: 1 };
battingCategoryDictionary['cs'] = { id: 'cs', biggerIsBetter: 0 };
battingCategoryDictionary['sbp'] = { id: 'sbp', biggerIsBetter: 1 };
battingCategoryDictionary['obp'] = { id: 'obp', biggerIsBetter: 1 };
battingCategoryDictionary['so'] = { id: 'so', biggerIsBetter: 0 };
battingCategoryDictionary['bb'] = { id: 'bb', biggerIsBetter: 1 };


var pitchingCategoryDictionary = {};
pitchingCategoryDictionary['ip'] = { id : 'ip', biggerIsBetter: 1 };
pitchingCategoryDictionary['er'] = { id : 'er', biggerIsBetter: 0 };
pitchingCategoryDictionary['goao'] = { id : 'goao', biggerIsBetter: 1 };
pitchingCategoryDictionary['so'] = { id: 'so', biggerIsBetter : 1 };
pitchingCategoryDictionary['bb'] = { id: 'bb', biggerIsBetter : 0 };
pitchingCategoryDictionary['kPerNine'] = { id: 'kPerNine', biggerIsBetter : 1 };
pitchingCategoryDictionary['kPerNine'] = { id: 'kPerNine', biggerIsBetter : 1 };
pitchingCategoryDictionary['whip'] = { id: 'whip', biggerIsBetter : 0 };
pitchingCategoryDictionary['era'] = { id: 'era', biggerIsBetter : 0 };
pitchingCategoryDictionary['w'] = { id : 'w', biggerIsBetter: 1 };
pitchingCategoryDictionary['qs'] = { id: 'qs', biggerIsBetter : 1 };
pitchingCategoryDictionary['sv'] = { id: 'sv', biggerIsBetter : 1 };


var defaultBattingCategories = [ 'r', 'rbi', 'hr', 'obp', 'sb' ];
var defaultPitchingCategories = [ 'w', 'so', 'whip', 'era', 'sv' ];

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
		includedCategories[c.id] = { id : c.id, batting : 1 };
		teams.sort(function(a, b) {
			if(a.stats.batting[c.id] > b.stats.batting[c.id]) {
				if(c.biggerIsBetter) {
					return 1;
				} else {
					return -1;
				}
			}
			if(a.stats.batting[c.id] < b.stats.batting[c.id]) {
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
			while(points < teams.length && teams[points-1].stats.batting[c.id] == teams[points].stats.batting[c.id]) {
				tiedTeams++;
				points++;
				pointsAllotment += points;
			}
			var totalTied = tiedTeams;
			while(tiedTeams > 0) {
				teamToPoints[teams[points - tiedTeams].teamId][c.id] = pointsAllotment / totalTied;
				teamToPoints[teams[points - tiedTeams].teamId]['total'] += pointsAllotment / totalTied;
				tiedTeams--;
			}
		}
	});
	pitchingCategories.forEach(function(cId) {
		var c = pitchingCategoryDictionary[cId];
		includedCategories[c.id] = { id : c.id, pitching : 1};
		teams.sort(function(a, b) {
			if(a.stats.pitching[c.id] > b.stats.pitching[c.id]) {
				if(c.biggerIsBetter) {
					return 1;
				} else {
					return -1;
				}
			}
			if(a.stats.pitching[c.id] < b.stats.pitching[c.id]) {
				if(c.biggerIsBetter) {
					return -1;
				} else {
					return 1;
				}
			}
			return 0;
		});
		//console.log(c.id);
		for(var points = 1; points <= teams.length; points++) {
			var pointsAllotment = points;
			var tiedTeams = 1;
			while(points < teams.length && teams[points-1].stats.pitching[c.id] == teams[points].stats.pitching[c.id]) {
				tiedTeams++;
				points++;
				pointsAllotment += points;
			}
			var totalTied = tiedTeams;
			while(tiedTeams > 0) {
				//console.log("Team: " + teams[points - tiedTeams].fullName + " Points: " + pointsAllotment / totalTied);
				teamToPoints[teams[points - tiedTeams].teamId][c.id] = pointsAllotment / totalTied;
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
	callback(teams, includedCategories);
}

module.exports = {
	calculateStandings : calculateStandings
}
