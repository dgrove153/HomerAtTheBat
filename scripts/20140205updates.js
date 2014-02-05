db.mlbplayers.update({},{$unset:{fantasy_team:''}},{multi:true})
db.mlbplayers.find({}).forEach(function(player) { db.mlbplayers.update(player, {$set:{'history.0.fantasy_position':player.history[1].fantasy_position}})});
db.mlbplayers.update({},{$unset:{fantasy_position:''}},{multi:true})