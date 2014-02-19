var KEEPER = require("../application/keeper");

module.exports = function(app, passport){

	//////////////
	//SAVE CHOICES
	//////////////

	app.post("/gm/keeper", function(req, res) {
		KEEPER.updateSelections(req.body, function(message) {
			res.send('worked');
		});
	});

	app.post("/gm/keeper/minorSwitch", function(req, res) {
		KEEPER.keepMinorLeaguerAsMajorLeaguer(req.user.team, req.body._id, undefined, true, function(message) {
			req.flash('message', message);
			res.redirect('/team/' + req.user.team);
		});
	});

	app.post("/gm/keeper/minorSwitch/undo", function(req, res) {
		KEEPER.keepMinorLeaguerAsMajorLeaguer(req.user.team, req.body._id, req.body.prevSalary, false, function(message) {
			req.flash('message', message);
			res.redirect('/team/' + req.user.team);
		});
	});

	//////////
	//FINALIZE
	//////////

	app.get("/gm/keeper/finalize", function(req, res) {
		KEEPER.finalizeKeeperSelections(function() {
			req.flash('info', "Keepers finalized.");
			res.redirect('/admin');
		});
	});
}