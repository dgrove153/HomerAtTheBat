module.exports = {
	year: 2013,
	isMILBDraftOn: false,
	minorLeaguerInningsPitchedThreshhold: 50,
	minorLeaguerAtBatsThreshhold: 150,
	email: {
		user: "homeratthebat@gmail.com",
		pass: "fantasybaseball"
	},
	development: {
		db: 'mongodb://localhost:27017/app18596138',
		app: {
			name: 'Homer At The Bat'
		},
		isVultureOn: true,
		isJobsOn: true,
		isOffseason: true,
		year: 2013,
		isKeeperPeriod: true,
		isTradingOn: false
	},
  	production: {
		db: 'mongodb://ari:ari@paulo.mongohq.com:10004/app18596138/baseball',
		app: {
			name: 'Homer At The Bat'
		},
		isVultureOn: false,
		isJobsOn: false,
		isOffseason: true,
		year: 2013,
		isKeeperPeriod: true,
		isTradingOn: false
	},
	getYear: function(env) {
		return this[env].isOffseason ? this[env].year + 1 : this[env].year;
	}
}
