var PLAYER = require("../models/player");
var ADMIN = require("./admin");
var MAILER = require("../util/mailer");

///////////////
//ROUTE ACTIONS
///////////////

exports.getOpenVultures = function(req, res, next) {
	PLAYER.find({'vulture.is_vultured':true}, function(err, doc) {
		res.locals.vultures = doc;
		next();
	});
};

exports.getVulturesForTeam = function(req, res, next) {
	PLAYER.find({fantasy_team: req.params.id, 'vulture.is_vultured':true}, function(err, doc) {
		res.locals.in_vultures = doc;
		PLAYER.find({'vulture.vulture_team':req.params.id, 'vulture.is_vultured':true}, function(err, doc) {
			res.locals.out_vultures = doc;
			next();
		})
	});
};

exports.isVultureEligible = function(req, res, next) {
	PLAYER.findOne({player_id: req.params.pid}, function(err, player) {
		if(err) throw err;
		var attemptToVulture = player.fantasy_team != req.user.team && (player.vulture == undefined || player.vulture.is_vultured == false);
		var attemptToFix = 
			player.fantasy_team == req.user.team && 
			(
				player.vulture != undefined && 
				player.vulture.is_vultured == true
			) ||
			(
				player.status_code != player.fantasy_status_code && 
				!player.history[0].minor_leaguer
			);
		if(attemptToVulture) {
			req.player = player;
			next();
		} else if(attemptToFix) {
			req.player = player;
			req.attemptToFix = true;
			next();
		} else {
			res.redirect("/team/" + req.user.team);	
		}
	});
};

//////////////////
//VULTURE CREATION
//////////////////

var setAsVultured = function(player, user) {
	player.vulture.is_vultured = true;
	player.vulture.vulture_team = user.team;
	var deadline = new Date();
	player.vulture.deadline = deadline.setDate(deadline.getDate() + 1);
}

var createVulture = function(vulture_player, drop_player, user, callback) {
	var vulture_valid = vulture_player.vulture == undefined || vulture_player.vulture.is_vultured == false;
	var remove_valid = drop_player.vulture == undefined || 
		(drop_player.vulture.is_vultured == false && drop_player.vulture.vultured_for_pid == undefined);

	if(vulture_valid && remove_valid) {
		setAsVultured(vulture_player, user);
		drop_player.vulture.vultured_for_pid = vulture_player.player_id;
		vulture_player.save();
		drop_player.save();
		MAILER.sendMail({ 
			from: 'Homer Batsman',
			to: 'arigolub@gmail.com',
			subject: vulture_player.name_display_first_last + " has been vultured",
			text: drop_player.history[0].fantasy_team + " is trying to vulture " + vulture_player.name_display_first_last + ". " +
				vulture_player.history[0].fantasy_team + " has until " + vulture_player.vulture.deadline + " to fix it."
		});
		callback("Vulture successful. Deadline is " + vulture_player.vulture.deadline + ".", 
			"/team/" + vulture_player.history[0].fantasy_team);
	} else if(!vulture_valid) {
		callback(vulture_player.name_display_first_last + " is already vultured, or is no longer eligible to be vultured.",
			"/team/" + vulture_player.history[0].fantasy_team);
	} else if(!remove_valid) {
		callback(drop_player.name_display_first_last + " is already in a pending vulture. Please select another player", 
			"/gm/vulture/" + vulture_player.player_id);
	}
};

exports.submitVulture = function(vulture_pid, removing_pid, user, callback) {
	PLAYER.findOne({player_id: vulture_pid}, function(err, doc) {
		var vulture_player = doc;
		PLAYER.findOne({player_id: removing_pid}, function(err, doc) {
			var removing_player = doc;
			createVulture(vulture_player, removing_player, user, callback);
		});
	});
};

/////////////////
//VULTURE ACTIONS
/////////////////

var removeVulture = function(player) {
	console.log(player);
	player.vulture.deadline = undefined;
	player.vulture.is_vultured = false;
	player.vulture.vulture_team = undefined;
}

exports.overrideVultureCancel = function(pid, callback) {
	PLAYER.findOne({player_id:pid}, function(err, player) {
		removeVulture(player);
		player.save();
		callback("Vulture removed");
	});
};

exports.updateStatusAndCheckVulture = function(pid, callback) {
	ADMIN.updateMLB(pid, function(player) {
		ADMIN.updateESPN(player.espn_player_id, function(player) {
			if(player.status_code == player.fantasy_status_code) {
				removeVulture(player);
				player.save();
				callback(true);
			} else {
				callback(false, player.status_code, player.fantasy_status_code);
			}
		});
	});
};