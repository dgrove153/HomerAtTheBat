var PLAYER = require('../models/player');
var MINORLEAGUEDRAFT = require('../application/minorLeagueDraft');
var VULTURE = require('../application/vulture');
var mongoose = require('mongoose');
var ASYNC = require('async');
var MLB = require('../external/mlb');
var ESPN = require('../external/espn');
//Environment variables
var 	env = process.env.NODE_ENV || 'development',
  	config = require('../config/config')[env];

//Database connection
mongoose.connect(config.db);

var vulture_id = 519184;
var giving_up_id = 501647;

var pick = {
	overall: 1,
	team: 'LAZ',
	player_id: 572888
};

// TEST 1: DRAFT
// MINORLEAGUEDRAFT.submitPick(pick, function(message) {
// 	console.log(message);
// });

// TEST 2: UPDATE MLB
// MLB.updateMLB_ALL(function(message) {
// 	console.log(message);
// });

// TEST 3: VULTURE
// ASYNC.series(
// 	[
// 		function(cb) {
// 			VULTURE.submitVulture(vulture_id, giving_up_id, { team:'GOB'}, function(message, url) {
// 				console.log(message);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({player_id:vulture_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({player_id:giving_up_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			VULTURE.removeVulture(vulture_id, function(message) {
// 				console.log(message);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({player_id:vulture_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}, function(cb) {
// 			PLAYER.findOne({player_id:giving_up_id}, function(err, player) {
// 				console.log(player.vulture);
// 				cb();
// 			});
// 		}
// 	]
// );

// TEST 4: Player is vulturable
// PLAYER.findOne({player_id:vulture_id}, function(err, player) {
// 	player.status_code = 'A';
// 	player.fantasy_status_code = 'DL';
// 	player.save(function() {
// 		VULTURE.isVultureLegal(vulture_id, giving_up_id, function(bool) {
// 			console.log(bool);
// 		});
// 	});
// });

// TEST 5: Player is not vulturable because of giving up player
// PLAYER.findOne({player_id:giving_up_id}, function(err, player) {
// 	player.vulture = { vultured_for_pid : 100 };
// 	player.save(function() {
// 		VULTURE.isVultureLegal(vulture_id, giving_up_id, function(bool) {
// 			console.log(bool);
// 		});
// 	});
// });

// TEST 6: Lockup
// //unsuccessful
// PLAYER.lockUpPlayer(519184, function(message) {
// 	console.log(message);
// });
// //successful
// PLAYER.lockUpPlayer(430832, function(message) {
// 	console.log(message);
// });

// TEST 7: ESPN Transactions
ESPN.updateESPN_Transactions('all');