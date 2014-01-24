var nodemailer = require('nodemailer');
var CONFIG = require('../config/config');
var USER = require('../models/user');

exports.sendMail = function(mailObj) {
	USER.find({}, function(err, users) {
		if(mailObj == undefined || mailObj == {} || !CONFIG.isMailOn) {
			return;
		}

		var smtpTransport = nodemailer.createTransport("SMTP",{
		    service: "Gmail",
		    auth: {
				user: CONFIG.email.user,
				pass: CONFIG.email.pass
		    }
		});	

		console.log("MAIL TO: " + mailObj.to.length);
		var mailTo = "";
		for(var i = 0; i < mailObj.to.length; i++) {
			var teamToSend = mailObj.to[i];
			for(var k = 0; k < users.length; k++) {
				var user = users[k];
				if(user.team == teamToSend) {
					//to.push(user.email);
					if(mailTo.length > 0) {
						mailTo = mailTo.concat(",");
					}
					mailTo = mailTo.concat(user.email);
				}
			}
		}
		console.log(mailTo);
		mailObj.to = mailTo;

		smtpTransport.sendMail(mailObj, function(error, response){
		    if(error){
				console.log(error);
		    } else {
				console.log("Message sent: " + response.message);
		    }

		    smtpTransport.close();
		});
	});
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