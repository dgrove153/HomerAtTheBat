var nodemailer = require('nodemailer');
var CONFIG = require('../config/config');

exports.sendMail = function(mailObj) {
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

	smtpTransport.sendMail(mailObj, function(error, response){
	    if(error){
			console.log(error);
	    } else {
			console.log("Message sent: " + response.message);
	    }

	    smtpTransport.close();
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