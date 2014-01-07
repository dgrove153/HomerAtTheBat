module.exports = {
	year: 2014,
	isKeeperPeriod: false,
	isOffseason: true,
	isLockupPeriod: true,
	isTradingOn: false,
	isMILBDraftOn: false,
	email: {
		user: "homeratthebat@gmail.com",
		pass: "fantasybaseball"
	},
	development: {
		db: 'mongodb://localhost:27017/app18596138',
		app: {
			name: 'Homer At The Bat'
		}
	},
  	production: {
		db: 'mongodb://ari:ari@paulo.mongohq.com:10004/app18596138/baseball',
		app: {
			name: 'Homer At The Bat'
		} 	
	}
}
