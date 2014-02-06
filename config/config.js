module.exports = {
	year: 2013,
	isKeeperPeriod: true,
	isOffseason: true,
	isLockupPeriod: true,
	isTradingOn: false,
	isMILBDraftOn: false,
	isMailOn: false,
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
		isJobsOn: true
	},
  	production: {
		db: 'mongodb://ari:ari@paulo.mongohq.com:10004/app18596138/baseball',
		app: {
			name: 'Homer At The Bat'
		},
		isVultureOn: false,
		isJobsOn: false
	}
}
