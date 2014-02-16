var nodemailer = require('nodemailer');
var CONFIG = require('../config/config').config();
var USER = require('../models/user');
var APPSETTING = require('../models/appSetting');

exports.sendMail = function(mailObj) {
	APPSETTING.findOne({ name : 'isMailOn' }, function(err, setting) {
		if(err) throw err;

		if(setting.value === "true") {
			USER.find({}, function(err, users) {
				if(mailObj == undefined || mailObj == {}) {
					return;
				}

				var smtpTransport = nodemailer.createTransport("SMTP",{
				    service: "Gmail",
				    auth: {
						user: CONFIG.email.user,
						pass: CONFIG.email.pass
				    }
				});	

				var mailTo = "";
				for(var i = 0; i < mailObj.to.length; i++) {
					var teamToSend = mailObj.to[i];
					for(var k = 0; k < users.length; k++) {
						var user = users[k];
						if(user.teamId == teamToSend) {
							if(mailTo.length > 0) {
								mailTo = mailTo.concat(",");
							}
							mailTo = mailTo.concat(user.email);
						}
					}
				}
				mailObj.to = mailTo;
				console.log(mailObj.to);
				smtpTransport.sendMail(mailObj, function(error, response){
				    if(error){
						console.log(error);
				    } else {
						console.log("Message sent: " + response.message);
				    }

				    smtpTransport.close();
				});
			});
		} else {
			return;
		}
	})
}

/*
COMPLETE MAIL EXAMPLE

app.get('/mailer', function(req, res) {
	var smtpTransport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
			user: CONFIG.email.user,
			pass: CONFIG.email.pass
	    }
	});		

	// setup e-mail data with unicode symbols
	var mailOptions = {
	    from: "Ari Golub",
	    to: "arigolub@gmail.com", // list of receivers
	    subject: "Hello", // Subject line
	    text: "Hello world", // plaintext body
	}

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if(error){
		console.log(error);
	    }else{
		console.log("Message sent: " + response.message);
	    }

	    // if you don't want to use this transport object anymore, uncomment following line
	    smtpTransport.close(); // shut down the connection pool, no more messages
	});

	res.send('sent');
});
*/