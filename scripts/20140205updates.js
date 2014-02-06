db.mlbplayers.update({},{$unset:{fantasy_team:''}},{multi:true})
db.mlbplayers.find({}).forEach(function(player) { db.mlbplayers.update(player, {$set:{'history.0.fantasy_position':player.history[1].fantasy_position}})});
db.mlbplayers.update({},{$unset:{fantasy_position:''}},{multi:true})

db.mlbplayers.update({},{$unset:{'history.0':null}},{multi:true})
db.mlbplayers.update({},{$pull:{history:null}},{multi:true})

db.mlbplayers.update({name_display_first_last:'Josmil Pinto'},{$set:{'history.0.minor_leaguer':true}})
db.mlbplayers.update({name_display_first_last:'Henry Urrutia'},{$set:{'history.0.minor_leaguer':true,'history.0.salary':3}})
db.mlbplayers.update({name_display_first_last:'Chase Headley'},{$set:{'history.0.contract_year':1}})