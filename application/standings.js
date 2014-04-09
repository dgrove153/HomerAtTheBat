var defaultBattingCategories = [ 
	{ id: 'r', biggerIsBetter: 1 }, 
	{ id: 'rbi', biggerIsBetter: 1 }, 
	{ id: 'hr', biggerIsBetter: 1 }, 
	{ id: 'obp', biggerIsBetter: 1 }, 
	{ id: 'sb', biggerIsBetter: 1 }
];
var defaultPitchingCategories = [ 
	{ id : 'w', biggerIsBetter: 1 }, 
	{ id: 'so', biggerIsBetter : 1 }, 
	{ id: 'whip', biggerIsBetter : 0 }, 
	{ id: 'era', biggerIsBetter : 0 }, 
	{ id: 'sv', biggerIsBetter : 1 }
];

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
	battingCategories.forEach(function(c) {
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
	pitchingCategories.forEach(function(c) {
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
	callback(teams);
}

module.exports = {
	calculateStandings : calculateStandings
}
