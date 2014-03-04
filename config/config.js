var env;

exports.setUpEnv = function(_env) {
	this.env = _env;
	return this;
};

exports.config = function() {
	return envConfig[this.env];
}

exports.clone = function() {
	var cloneConfig = {};
	for(var prop in envConfig[this.env]) {
		cloneConfig[prop] = envConfig[this.env][prop];
	}
	return cloneConfig;
}

var envConfig = {
	development: {
		env: 'development',
		db: 'mongodb://localhost:27017/app18596138',
		app: {
			name: 'Homer At The Bat'
		},
		isVultureOn: true,
		isJobsOn: true,
		isOffseason: true,
		isKeeperPeriod: true,
		year: 2013,
		nextYear: 2014,
		isTradingOn: true,
		isMILBDraftOn: false,
		isMailOn: 'ari',
		minorLeaguerInningsPitchedThreshhold: 50,
		minorLeaguerAtBatsThreshhold: 150,
		email: {
			user: "homeratthebat@gmail.com",
			pass: "fantasybaseball"
		},
		vultureTimeframe : 'minutes',
		vultureDuration : 1
	},
  	production: {
  		env: 'production',
		db: 'mongodb://ari:ari@paulo.mongohq.com:10004/app18596138/baseball',
		app: {
			name: 'Homer At The Bat'
		},
		isVultureOn: false,
		isJobsOn: false,
		isOffseason: true,
		year: 2013,
		nextYear: 2014,
		isKeeperPeriod: true,
		isTradingOn: false,
		isMILBDraftOn: false,
		isMailOn: false,
		minorLeaguerInningsPitchedThreshhold: 50,
		minorLeaguerAtBatsThreshhold: 150,
		email: {
			user: "homeratthebat@gmail.com",
			pass: "fantasybaseball"
		},
		vultureTimeframe : 'hours',
		vultureDuration : 24
	}
}
