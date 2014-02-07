db.mlbplayers.update({},{$unset:{'history.0':null}},{multi:true})
db.mlbplayers.update({},{$pull:{history:null}},{multi:true})

db.mlbplayers.update({},{$unset:{fantasy_team:''}},{multi:true})
//db.mlbplayers.find({}).forEach(function(player) { db.mlbplayers.update(player, {$set:{'history.0.fantasy_position':player.history[1].fantasy_position}})});
db.mlbplayers.find({}).forEach(function(player) { db.mlbplayers.update(player, {$set:{'history.0.fantasy_position':player.fantasy_position}})});
db.mlbplayers.update({},{$unset:{fantasy_position:''}},{multi:true})

//DBAG
db.mlbplayers.update({name_display_first_last:'Angelo Gumbs'},{$set:{'history.0.fantasy_team':undefined}});
db.mlbplayers.update({name_display_first_last:'Josmil Pinto'},{$set:{'history.0.minor_leaguer':true,'history.0.salary':3}});
db.mlbplayers.update({name_display_first_last:'Henry Urrutia'},{$set:{'history.0.minor_leaguer':true,'history.0.salary':3}});

//JEFF
db.mlbplayers.update({name_display_first_last:'Hak-Ju Lee'},{$set:{'history.0.minor_leaguer':true}});

//LAZ
db.mlbplayers.update({name_display_first_last:'Jenrry Mejia'},{$set:{'history.0.minor_leaguer':true,'history.0.salary':3}});

//HIV+
db.mlbplayers.update({name_display_first_last:'Collin McHugh'},{$set:{'history.0.fantasy_team':'HIV+','history.0.salary':0,'history.0.contract_year':0,'history.0.keeper_team':'HIV+','history.0.minor_leaguer':true}});

GOB
	260
-	6
-	2
-	3
=	249
-	32
// Felix Hernandez
db.cash.update({team:'GOB',year:2014,type:'MLB'},{$set:{value:217}})
SHAW
	260
+	8
-	3
-	8
+	5
+	3
+	3
+	5
=	273
-	43
// Robinson Cano
db.cash.update({team:'SHAW',year:2014,type:'MLB'},{$set:{value:230}})
GRAN
	260
+	10
-	7
-	3
+	4
=	264
db.cash.update({team:'GRAN',year:2014,type:'MLB'},{$set:{value:264}})
SIDO
	260
+	6
+	3
=	269
db.cash.update({team:'SIDO',year:2014,type:'MLB'},{$set:{value:269}})
PUIG
	260
-	8
+	5
+ 	8
+	3
+	7
-	1
-	3
-	10
-	13
+	8
+	7
-	3
+	5
+	5
-	3
+	5
=	272
db.cash.update({team:'PUIG',year:2014,type:'MLB'},{$set:{value:272}})
MAD
	260
-	5
-	7
+	13
-	5
-	5
+	3
+	3
=	257
db.cash.update({team:'MAD',year:2014,type:'MLB'},{$set:{value:257}})
CHOB
	260
+	3
-	6
-	3
+	7
=	261
db.cash.update({team:'CHOB',year:2014,type:'MLB'},{$set:{value:261}})
GLRY
	260
-	5
+	2
+	3
-	5
+	8
=	263
db.cash.update({team:'GLRY',year:2014,type:'MLB'},{$set:{value:263}})
JEFF
	260
+	5
-	5
+	6
+	1
=	267
db.cash.update({team:'JEFF',year:2014,type:'MLB'},{$set:{value:267}})
LAZ
	260
-	8
+	1
+	2
=	255
db.cash.update({team:'LAZ',year:2014,type:'MLB'},{$set:{value:255}})
DBAG
	260
-	3
=	257
db.cash.update({team:'DBAG',year:2014,type:'MLB'},{$set:{value:257}})
HIV+
	260
+	3
+	6
=	269
-	30
// Giancarlo Stanton
db.cash.update({team:'HIV+',year:2014,type:'MLB'},{$set:{value:239}})

// $9 in 2014 Major league auction draft cash: Jeff "Finish Rock Hard" Berk (72 points)
// $8: Brian ""Body by Cheesesteak" McGlade (60 points)
// $7: Michael "Reverse Oreo" Pollack (51 points)
// $6: Antoine "Tasso" Gobin (50 points)
// $5: Josh "insert nickname here" Granata (49 points)
// $4: Michael "http://imgur.com/gallery/lSYDV" Davey (46 points)
// $3: Brendan "Basically works with Jay-Z" Lazarus (45 points)
// $2: Darren "Hype Man" Grove (41.5)
// $1: Jacob "the baby" Gerber and Matt "Jeffrey Loria" Shapiro (32.5 points)

db.mlbplayers.update({name_display_first_last:'Jose Quintana'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Jonathon Niese'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Joe Smith'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Yusmeiro Petit'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Jarrod Parker'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Andy Pettitte'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Carlos Torres'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'James Loney'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Trevor Rosenthal'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Alexi Ogando'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Trevor Cahill'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Alex Avila'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Chase Headley'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Craig Gentry'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Martin Perez'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Mike Leake'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Alex Gordon'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Jose Tabata'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Kevin Siegrist'},{$set:{isKeeperIneligible:true}});
db.mlbplayers.update({name_display_first_last:'Marco Estrada'},{$set:{isKeeperIneligible:true}});
