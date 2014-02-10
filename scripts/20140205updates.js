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

db.teams.update({team:'GOB'},{$set:{preKeeperCash:217}});
db.teams.update({team:'SHAW'},{$set:{preKeeperCash:230}});
db.teams.update({team:'GRAN'},{$set:{preKeeperCash:264}});
db.teams.update({team:'SIDO'},{$set:{preKeeperCash:269}});
db.teams.update({team:'PUIG'},{$set:{preKeeperCash:272}});
db.teams.update({team:'MAD'},{$set:{preKeeperCash:257}});
db.teams.update({team:'CHOB'},{$set:{preKeeperCash:261}});
db.teams.update({team:'GLRY'},{$set:{preKeeperCash:263}});
db.teams.update({team:'JEFF'},{$set:{preKeeperCash:267}});
db.teams.update({team:'LAZ'},{$set:{preKeeperCash:255}});
db.teams.update({team:'DBAG'},{$set:{preKeeperCash:257}});
db.teams.update({team:'HIV+'},{$set:{preKeeperCash:239}});

// $8 in 2014 Major league auction draft cash: Jeff "Finish Rock Hard" Berk (72 points)
// $7: Brian ""Body by Cheesesteak" McGlade (60 points)
// $6: Michael "Reverse Oreo" Pollack (51 points)
// $5: Antoine "Tasso" Gobin (50 points)
// $4: Josh "insert nickname here" Granata (49 points)
// $3: Michael "http://imgur.com/gallery/lSYDV" Davey (46 points)
// $2: Brendan "Basically works with Jay-Z" Lazarus (45 points)
// $1: Darren "Hype Man" Grove (41.5)
// $0: Jacob "the baby" Gerber and Matt "Jeffrey Loria" Shapiro (32.5 points)

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




//02 09
db.mlbplayers.update({'history.0.keeper_team':''},{$unset:{'history.0.keeper_team':''}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':null},{$unset:{'history.0.keeper_team':''}},{multi:true});

db.teams.update({team:'GOB'},{$set:{teamId:1}});
db.teams.update({team:'CHOB'},{$set:{teamId:2}});
db.teams.update({team:'GLRY'},{$set:{teamId:3}});
db.teams.update({team:'SIDO'},{$set:{teamId:4}});
db.teams.update({team:'MAD'},{$set:{teamId:5}});
db.teams.update({team:'JEFF'},{$set:{teamId:6}});
db.teams.update({team:'GRAN'},{$set:{teamId:7}});
db.teams.update({team:'LAZ'},{$set:{teamId:8}});
db.teams.update({team:'DBAG'},{$set:{teamId:9}});
db.teams.update({team:'HIV+'},{$set:{teamId:10}});
db.teams.update({team:'PUIG'},{$set:{teamId:11}});
db.teams.update({team:'SHAW'},{$set:{teamId:12}});


db.cash.update({team:'GOB'},{$set:{team:1}}, {multi:true});
db.cash.update({team:'CHOB'},{$set:{team:2}}, {multi:true});
db.cash.update({team:'GLRY'},{$set:{team:3}}, {multi:true});
db.cash.update({team:'SIDO'},{$set:{team:4}}, {multi:true});
db.cash.update({team:'MAD'},{$set:{team:5}}, {multi:true});
db.cash.update({team:'JEFF'},{$set:{team:6}}, {multi:true});
db.cash.update({team:'GRAN'},{$set:{team:7}}, {multi:true});
db.cash.update({team:'LAZ'},{$set:{team:8}}, {multi:true});
db.cash.update({team:'DBAG'},{$set:{team:9}}, {multi:true});
db.cash.update({team:'HIV+'},{$set:{team:10}}, {multi:true});
db.cash.update({team:'PUIG'},{$set:{team:11}}, {multi:true});
db.cash.update({team:'SHAW'},{$set:{team:12}}, {multi:true});

db.users.update({team:'GOB'},{$set:{team:1}}, {multi:true});
db.users.update({team:'CHOB'},{$set:{team:2}}, {multi:true});
db.users.update({team:'GLRY'},{$set:{team:3}}, {multi:true});
db.users.update({team:'SIDO'},{$set:{team:4}}, {multi:true});
db.users.update({team:'MAD'},{$set:{team:5}}, {multi:true});
db.users.update({team:'JEFF'},{$set:{team:6}}, {multi:true});
db.users.update({team:'GRAN'},{$set:{team:7}}, {multi:true});
db.users.update({team:'LAZ'},{$set:{team:8}}, {multi:true});
db.users.update({team:'DBAG'},{$set:{team:9}}, {multi:true});
db.users.update({team:'HIV+'},{$set:{team:10}}, {multi:true});
db.users.update({team:'PUIG'},{$set:{team:11}}, {multi:true});
db.users.update({team:'SHAW'},{$set:{team:12}}, {multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'GOB'},{$set:{'history.0.fantasy_team':1}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'GOB'},{$set:{'history.0.keeper_team':1}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'GOB'},{$set:{'history.0.draft_team':1}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'CHOB'},{$set:{'history.0.fantasy_team':2}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'CHOB'},{$set:{'history.0.keeper_team':2}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'CHOB'},{$set:{'history.0.draft_team':2}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'GLRY'},{$set:{'history.0.fantasy_team':3}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'GLRY'},{$set:{'history.0.keeper_team':3}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'GLRY'},{$set:{'history.0.draft_team':3}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'SIDO'},{$set:{'history.0.fantasy_team':4}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'SIDO'},{$set:{'history.0.keeper_team':4}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'SIDO'},{$set:{'history.0.draft_team':4}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'MAD'},{$set:{'history.0.fantasy_team':5}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'MAD'},{$set:{'history.0.keeper_team':5}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'MAD'},{$set:{'history.0.draft_team':5}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'JEFF'},{$set:{'history.0.fantasy_team':6}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'JEFF'},{$set:{'history.0.keeper_team':6}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'JEFF'},{$set:{'history.0.draft_team':6}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'GRAN'},{$set:{'history.0.fantasy_team':7}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'GRAN'},{$set:{'history.0.keeper_team':7}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'GRAN'},{$set:{'history.0.draft_team':7}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'LAZ'},{$set:{'history.0.fantasy_team':8}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'LAZ'},{$set:{'history.0.keeper_team':8}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'LAZ'},{$set:{'history.0.draft_team':8}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'DBAG'},{$set:{'history.0.fantasy_team':9}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'DBAG'},{$set:{'history.0.keeper_team':9}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'DBAG'},{$set:{'history.0.draft_team':9}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'HIV+'},{$set:{'history.0.fantasy_team':10}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'HIV+'},{$set:{'history.0.keeper_team':10}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'HIV+'},{$set:{'history.0.draft_team':10}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'PUIG'},{$set:{'history.0.fantasy_team':11}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'PUIG'},{$set:{'history.0.keeper_team':11}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'PUIG'},{$set:{'history.0.draft_team':11}},{multi:true});

db.mlbplayers.update({'history.0.fantasy_team':'SHAW'},{$set:{'history.0.fantasy_team':12}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'SHAW'},{$set:{'history.0.keeper_team':12}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'SHAW'},{$set:{'history.0.draft_team':12}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'GOB'},{$set:{'history.1.fantasy_team':1}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'GOB'},{$set:{'history.1.keeper_team':1}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'GOB'},{$set:{'history.1.draft_team':1}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'CHOB'},{$set:{'history.1.fantasy_team':2}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'CHOB'},{$set:{'history.1.keeper_team':2}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'CHOB'},{$set:{'history.1.draft_team':2}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'GLRY'},{$set:{'history.1.fantasy_team':3}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'GLRY'},{$set:{'history.1.keeper_team':3}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'GLRY'},{$set:{'history.1.draft_team':3}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'SIDO'},{$set:{'history.1.fantasy_team':4}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'SIDO'},{$set:{'history.1.keeper_team':4}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'SIDO'},{$set:{'history.1.draft_team':4}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'MAD'},{$set:{'history.1.fantasy_team':5}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'MAD'},{$set:{'history.1.keeper_team':5}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'MAD'},{$set:{'history.1.draft_team':5}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'JEFF'},{$set:{'history.1.fantasy_team':6}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'JEFF'},{$set:{'history.1.keeper_team':6}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'JEFF'},{$set:{'history.1.draft_team':6}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'GRAN'},{$set:{'history.1.fantasy_team':7}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'GRAN'},{$set:{'history.1.keeper_team':7}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'GRAN'},{$set:{'history.1.draft_team':7}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'LAZ'},{$set:{'history.1.fantasy_team':8}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'LAZ'},{$set:{'history.1.keeper_team':8}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'LAZ'},{$set:{'history.1.draft_team':8}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'DBAG'},{$set:{'history.1.fantasy_team':9}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'DBAG'},{$set:{'history.1.keeper_team':9}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'DBAG'},{$set:{'history.1.draft_team':9}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'HIV+'},{$set:{'history.1.fantasy_team':10}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'HIV+'},{$set:{'history.1.keeper_team':10}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'HIV+'},{$set:{'history.1.draft_team':10}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'PUIG'},{$set:{'history.1.fantasy_team':11}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'PUIG'},{$set:{'history.1.keeper_team':11}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'PUIG'},{$set:{'history.1.draft_team':11}},{multi:true});

db.mlbplayers.update({'history.1.fantasy_team':'SHAW'},{$set:{'history.1.fantasy_team':12}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'SHAW'},{$set:{'history.1.keeper_team':12}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'SHAW'},{$set:{'history.1.draft_team':12}},{multi:true});

db.teams.insert({fullName:'Free Agent',team:'FA',teamId:0})
db.mlbplayers.update({'history.0.fantasy_team':'FA'},{$set:{'history.0.fantasy_team':0}},{multi:true});
db.mlbplayers.update({'history.0.keeper_team':'FA'},{$set:{'history.0.keeper_team':0}},{multi:true});
db.mlbplayers.update({'history.0.draft_team':'FA'},{$set:{'history.0.draft_team':0}},{multi:true});
db.mlbplayers.update({'history.1.fantasy_team':'FA'},{$set:{'history.1.fantasy_team':0}},{multi:true});
db.mlbplayers.update({'history.1.keeper_team':'FA'},{$set:{'history.1.keeper_team':0}},{multi:true});
db.mlbplayers.update({'history.1.draft_team':'FA'},{$set:{'history.1.draft_team':0}},{multi:true});

db.minorLeagueDraft.update({original_team:'GOB'},{$set:{original_team:1}},{multi:true});
db.minorLeagueDraft.update({original_team:'CHOB'},{$set:{original_team:2}},{multi:true});
db.minorLeagueDraft.update({original_team:'GLRY'},{$set:{original_team:3}},{multi:true});
db.minorLeagueDraft.update({original_team:'SIDO'},{$set:{original_team:4}},{multi:true});
db.minorLeagueDraft.update({original_team:'MAD'},{$set:{original_team:5}},{multi:true});
db.minorLeagueDraft.update({original_team:'JEFF'},{$set:{original_team:6}},{multi:true});
db.minorLeagueDraft.update({original_team:'GRAN'},{$set:{original_team:7}},{multi:true});
db.minorLeagueDraft.update({original_team:'LAZ'},{$set:{original_team:8}},{multi:true});
db.minorLeagueDraft.update({original_team:'DBAG'},{$set:{original_team:9}},{multi:true});
db.minorLeagueDraft.update({original_team:'HIV+'},{$set:{original_team:10}},{multi:true});
db.minorLeagueDraft.update({original_team:'PUIG'},{$set:{original_team:11}},{multi:true});
db.minorLeagueDraft.update({original_team:'SHAW'},{$set:{original_team:12}},{multi:true});

db.minorLeagueDraft.update({team:'GOB'},{$set:{team:1}},{multi:true});
db.minorLeagueDraft.update({team:'CHOB'},{$set:{team:2}},{multi:true});
db.minorLeagueDraft.update({team:'GLRY'},{$set:{team:3}},{multi:true});
db.minorLeagueDraft.update({team:'SIDO'},{$set:{team:4}},{multi:true});
db.minorLeagueDraft.update({team:'MAD'},{$set:{team:5}},{multi:true});
db.minorLeagueDraft.update({team:'JEFF'},{$set:{team:6}},{multi:true});
db.minorLeagueDraft.update({team:'GRAN'},{$set:{team:7}},{multi:true});
db.minorLeagueDraft.update({team:'LAZ'},{$set:{team:8}},{multi:true});
db.minorLeagueDraft.update({team:'DBAG'},{$set:{team:9}},{multi:true});
db.minorLeagueDraft.update({team:'HIV+'},{$set:{team:10}},{multi:true});
db.minorLeagueDraft.update({team:'PUIG'},{$set:{team:11}},{multi:true});
db.minorLeagueDraft.update({team:'SHAW'},{$set:{team:12}},{multi:true});

db.minorLeagueDraft.update({swapper:'GOB'},{$set:{swapper:1}},{multi:true});
db.minorLeagueDraft.update({swapper:'CHOB'},{$set:{swapper:2}},{multi:true});
db.minorLeagueDraft.update({swapper:'GLRY'},{$set:{swapper:3}},{multi:true});
db.minorLeagueDraft.update({swapper:'SIDO'},{$set:{swapper:4}},{multi:true});
db.minorLeagueDraft.update({swapper:'MAD'},{$set:{swapper:5}},{multi:true});
db.minorLeagueDraft.update({swapper:'JEFF'},{$set:{swapper:6}},{multi:true});
db.minorLeagueDraft.update({swapper:'GRAN'},{$set:{swapper:7}},{multi:true});
db.minorLeagueDraft.update({swapper:'LAZ'},{$set:{swapper:8}},{multi:true});
db.minorLeagueDraft.update({swapper:'DBAG'},{$set:{swapper:9}},{multi:true});
db.minorLeagueDraft.update({swapper:'HIV+'},{$set:{swapper:10}},{multi:true});
db.minorLeagueDraft.update({swapper:'PUIG'},{$set:{swapper:11}},{multi:true});
db.minorLeagueDraft.update({swapper:'SHAW'},{$set:{swapper:12}},{multi:true});

db.minorLeagueDraft.update({swap_team:'GOB'},{$set:{swap_team:1}},{multi:true});
db.minorLeagueDraft.update({swap_team:'CHOB'},{$set:{swap_team:2}},{multi:true});
db.minorLeagueDraft.update({swap_team:'GLRY'},{$set:{swap_team:3}},{multi:true});
db.minorLeagueDraft.update({swap_team:'SIDO'},{$set:{swap_team:4}},{multi:true});
db.minorLeagueDraft.update({swap_team:'MAD'},{$set:{swap_team:5}},{multi:true});
db.minorLeagueDraft.update({swap_team:'JEFF'},{$set:{swap_team:6}},{multi:true});
db.minorLeagueDraft.update({swap_team:'GRAN'},{$set:{swap_team:7}},{multi:true});
db.minorLeagueDraft.update({swap_team:'LAZ'},{$set:{swap_team:8}},{multi:true});
db.minorLeagueDraft.update({swap_team:'DBAG'},{$set:{swap_team:9}},{multi:true});
db.minorLeagueDraft.update({swap_team:'HIV+'},{$set:{swap_team:10}},{multi:true});
db.minorLeagueDraft.update({swap_team:'PUIG'},{$set:{swap_team:11}},{multi:true});
db.minorLeagueDraft.update({swap_team:'SHAW'},{$set:{swap_team:12}},{multi:true});

db.mlbplayers.update({name_display_first_last:'James Shields'},{$set:{'history.0.fantasy_team':5}})
db.teams.update({teamId:5},{$set:{preKeeperCash:253}});
db.teams.update({teamId:11},{$set:{preKeeperCash:276}});
db.cash.find({team:11,type:'MLB'}).forEach(
	function(cash) { 
		var newValue;
		if(cash.year == 2014) {
			newValue = cash.value + 4;
			db.cash.update(cash, {$set:{value:newValue}});
		} else if(cash.year == 2015 || cash.year == 2016 || cash.year == 2017) {
			newValue = cash.value + 3;
			db.cash.update(cash, {$set:{value:newValue}});
		}
	}
);
db.cash.find({team:5,type:'MLB'}).forEach(
	function(cash) { 
		var newValue;
		if(cash.year == 2014) {
			newValue = cash.value - 4;
			db.cash.update(cash, {$set:{value:newValue}});
		} else if(cash.year == 2015 || cash.year == 2016 || cash.year == 2017) {
			newValue = cash.value - 3;
			db.cash.update(cash, {$set:{value:newValue}});
		}
	}
);