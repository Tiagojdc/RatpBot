promise = require('promise'),
Telegraf = require('telegraf'),
reply = require('telegraf').reply,
Markup = require('telegraf').Markup,
Extra = require('telegraf').Extra,
Router = require('telegraf').Router,
memorySession = require('telegraf').memorySession,
https = require('https'),
fs = require('fs'),
moment = require('moment');

API = require('./api.js')

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(memorySession())

var cmdArray = ['/help', '/notif', '/fav','/tramways', '/rers', '/metros', '/bus', '/noctiliens'];

bot.use((ctx, next) => {
	let cmd = ctx.message.text.split(' ')[0];
	if (in_array(cmd, cmdArray)){
		return next();
	} else {
		return usage(ctx);
	}

})


bot.command('help', (ctx) => {
	return usage(ctx);
})

bot.command('tramways', (ctx) => {
	requestAPI(ctx, 'tramways').then(function(data){ return data; },function(error){ return error; });
	
})
   
bot.command('rers', (ctx) => {
	requestAPI(ctx, 'rers').then(function(data){ return data; },function(error){ return error; });	
})
   
bot.command('metros', (ctx) => {
	requestAPI(ctx, 'metros').then(function(data){ return data; },function(error){ return error; });
	
})	

bot.command('bus', (ctx) => {
	requestAPI(ctx, 'bus').then(function(data){ return data; },function(error){ return error; });
})	

bot.command('noctiliens', (ctx) => {
	requestAPI(ctx, 'noctiliens').then(function(data){ return data; },function(error){ return error; });
});
	

bot.command('notif', (ctx) => {
	var data = ctx.message.text.split(' ');
	if (data.length >= 2){
		if(data[1] == 'del') return delNotify(ctx, data);
		else if(data[1] == 'add') return addNotify(ctx, data);
		else if (data[1] == 'list') return listNotify(ctx, data);
		else return usage(ctx);
	} else {
		return ctx.reply("**** Notifications ****\n"+
		"/notif list\n"+
		"/notif <add/del> <heure>:<minute> <Type> <Numéro> <Station>\n"
		, Markup.keyboard(['/notif list','/notif add','/notif del']).oneTime().resize().extra());
	}
});


bot.command('fav', (ctx) => {
	var data = ctx.message.text.split(' ');
	if (data.length >= 2){
		if(data[1] == 'del') return delFavorite(ctx, data);
		else if(data[1] == 'add') return addFavorite(ctx, data);
		else if (data[1] == 'list') return listFavorite(ctx, data);
		else return usage(ctx);
	} else {
		return ctx.reply("**** Favoris ****\n"+
		"/fav list\n"+
		"/fav <add/del> <Type> <Numéro> <Station>\n"
		, Markup.keyboard(['/fav list','/fav add','/fav del']).oneTime().resize().extra());
	}
});


var usage = function(ctx){
	return ctx.reply("Utilisation :\n"+
	"**** Requete temps réel ****\n"+
	"/<Type>\n"+
	"/<Type> <Numéro>\n"+
	"/<Type> <Numéro> <Station>\n"+
	"Exemple : /tramways 1 la noue\n" +
	"Commandes : /tramways /metros /rers /bus /noctiliens\n" +
	"**** Notifications ****\n"+
	"/notif list\n"+
	"/notif <add/del> <heure>:<minute> <Type> <Numéro> <Station>\n"+
	"Exemple : /notif add 7:30 tramways 1 la noue\n" +
	"**** Favoris ****\n"+
	"/fav list\n"+
	"/fav <add/del> <Type> <Numéro> <Station>\n"+
	"Exemple : /fav add tramways 1 la noue\n" +
	"\n"+
	"/help pour l'aide"
	, Markup.keyboard(['/tramways','/metros','/rers', '/bus', '/noctiliens', '/notif', '/fav']).oneTime().resize().extra());
}


var requestAPI = function(ctx, typeLine){
	return new Promise(		
		function(resolve, reject){
			try {
				var text = ctx.message.text;
				var data = text.split(' ');
				if (data.length == 1) {
					API.getLines(typeLine)
					.then(function(data){
						if (typeLine == "bus") {
							resolve(ctx.reply("Commande non supportée pour les bus."))
						} else {
							resolve(ctx.reply('Numéro ligne pour '+typeLine, Markup.keyboard(data).oneTime().resize().extra()))
						}
					},function(error){
						reject(usage(ctx))
					});
				}
				if(data.length == 2){
					lineId = data[1];
					API.getStations(typeLine, lineId)
					.then(function(data){
						if (typeLine == "bus") {
							resolve(ctx.reply("Commande non supportée pour les bus."))
						} else {
							resolve(ctx.reply('Stations pour '+typeLine + ' ' +lineId, Markup.keyboard(data).oneTime().resize().extra()))	
						}
					},function(error){
						reject(usage(ctx))
					});
				}
	
				if(data.length >= 3){

					if (data.length != 3) {
						data[2] = data.slice(2, data.length).join('+');
					}
		
					API.getDest(typeLine, data[1])
					.then(function(directions){
						Promise.all([
							API.getData(typeLine, data[1], data[2], directions[0]),
							API.getData(typeLine, data[1], data[2], directions[1])
						])
						.then(([res1, res2]) => {
							res = res1.concat(res2);
							resolve(ctx.reply(res.join('\n')));
						},function(error){
							reject(usage(ctx))
						});
			
					},function(error){
						reject(usage(ctx))
					});
				}
			} catch (e){
				console.log(e.message);
				reject(usage(ctx));
			}
		}
	)
}

var addNotify = function(ctx, data){
	var userId = ctx.message.chat.id
	var text = ctx.message.text;
	if(data.length >= 6){
		var timeStr = data[2];
		var typeLine = data[3];
		if (typeLine == 'tramways' || typeLine == 'rers' || typeLine == 'metros' || typeLine == 'bus' || typeLine == 'noctiliens'){
			try {
				//console.log(data)
				if (data.length != 6) {
					data[5] = data.slice(5, data.length).join('+');
				}
				
				test_data = API.getDest(typeLine, data[4])
				.then(function(directions){
					Promise.all([
						API.getData(typeLine, data[4], data[5], directions[0]),
						API.getData(typeLine, data[4], data[5], directions[1])
					])
					.then(([res1, res2]) => {
						let res = res1.concat(res2);
						if (res != undefined){
							var time = moment(timeStr, 'HH:mm');
							var test_data = undefined;
							var cache = load();
							if (cache == null) {
								cache = [];
							}
							var obj = {
								'userid' : userId ,
								'type' : 'notif',
								'time' : time.get('hour') + ':' + time.get('minute'),
								'cmd' : typeLine + ' ' + data[4] + ' ' + data[5]
							}
							cache.push(obj)
							save(cache)
							return ctx.reply('Opération effectuée avec succès.')
						}
					})
					//if (testData == undefined)
					//	throw ''
				});
				//console.log(time.get('hour') + ':' + time.get('minute'))
			} catch(e){
				console.log(e.message);
				return ctx.message("Une erreur est survenue");
			}
		} else {
			return usage(ctx);
		}
	}	
}



var delNotify = function(ctx, data){
	userId = ctx.message.chat.id
	if(data.length >= 6){
		var timeStr = data[2];
		var typeLine = data[3];
		if (typeLine == 'tramways' || typeLine == 'rers' || typeLine == 'metros' || typeLine == 'bus' || typeLine == 'noctiliens'){
			try {
				if (data.length != 6) {
					data[5] = data.slice(5, data.length).join('+');
				}
				
				var cache = load()
				var changes = false;
				if (cache != null){
					cache.forEach(function(item, index){
						rt = moment(timeStr, 'HH:mm')
						t = moment(item.time, 'HH:mm');
						if ((rt.get('hour') == t.get('hour') && rt.get('minute') == t.get('minute')) && item.userid == userId && item.cmd == typeLine + ' ' + data[4] + ' ' + data[5] && item.type == 'notif'){
							cache.remove(index);
							changes = true;
						}
					});
					save(cache);
					if (changes)
						return ctx.reply('Opération effectuée avec succès.');
					else 
						return ctx.reply('Aucune modification n\'a été effectuée.');
				}
				
			} catch(e){
				console.log(e.message);
				return ctx.message("Une erreur est survenue");
			}
		} else {
			return usage(ctx);
		}
	}
}

var listNotify = function(ctx, data){	
	userId = ctx.message.chat.id
	try {
		cache = load()
		if (cache != null){
			textArray = []
			cache.forEach(function(item){
				if (item.userid == userId && item.type == "notif"){
					textArray.push(item.time + ' ' + item.cmd.replace(/\+/g,' '));
				}
				
			});
			if(textArray.length > 0){
				return ctx.reply(textArray.join('\n'));
			} else {
				return ctx.reply('Il n\'y a pas de notification');
			}
		}
	} catch(e){
		console.log(e.message);
		return ctx.message("Une erreur est survenue");
	}
}




var addFavorite = function(ctx, data){
	var userId = ctx.message.chat.id
	var text = ctx.message.text;
	if(data.length >= 5){
		var typeLine = data[2];
		if (typeLine == 'tramways' || typeLine == 'rers' || typeLine == 'metros' || typeLine == 'bus' || typeLine == 'noctiliens'){
			try {
				//console.log(data)
				if (data.length != 5) {
					data[4] = data.slice(4, data.length).join('+');
				}
				
				test_data = API.getDest(typeLine, data[3])
				.then(function(directions){
					Promise.all([
						API.getData(typeLine, data[3], data[4], directions[0]),
						API.getData(typeLine, data[3], data[4], directions[1])
					])
					.then(([res1, res2]) => {
						let res = res1.concat(res2);
						if (res != undefined){
							var test_data = undefined;
							var cache = load();
							if (cache == null) {
								cache = [];
							}
							var obj = {
								'userid' : userId ,
								'type' : 'fav',
								'cmd' : '/' + typeLine + ' ' + data[3] + ' ' + data[4]
							}
							cache.push(obj)
							save(cache)
							return ctx.reply('La commande a bien été prise en compte.')
						}
					})
					//if (testData == undefined)
					//	throw ''
				});
				//console.log(time.get('hour') + ':' + time.get('minute'))
			} catch(e){
				console.log(e.message);
				return ctx.message("Une erreur est survenue");
			}
		} else {
			return usage(ctx);
		}
	}	
}


var listFavorite = function(ctx, data){	
	userId = ctx.message.chat.id
	try {
		cache = load()
		if (cache != null){
			arr = []
			cache.forEach(function(item){
				if (item.userid == userId && item.type == "fav"){
					arr.push(item.cmd.replace(/\+/g,' '));
				}
				
			});
			if(arr.length > 0){
				return ctx.reply("Liste des favoris", Markup.keyboard(arr).oneTime().resize().extra());
			} else {
				return ctx.reply('Il n\'y a pas de favoris');
			}
		}
	} catch(e){
		console.log(e.message);
		return ctx.message("Une erreur est survenue");
	}
}

var delFavorite = function(ctx, data){
	userId = ctx.message.chat.id
	if(data.length >= 5){
		var typeLine = data[2];
		if (typeLine == 'tramways' || typeLine == 'rers' || typeLine == 'metros' || typeLine == 'bus' || typeLine == 'noctiliens'){
			try {
				if (data.length != 5) {
					data[4] = data.slice(4, data.length).join('+');
				}
				
				var cache = load()
				var changes = false;
				if (cache != null){
					cache.forEach(function(item, index){
						if (item.userid == userId && item.cmd == '/' + typeLine + ' ' + data[3] + ' ' + data[4] && item.type == 'fav'){
							cache.remove(index);
							changes = true;
						}
					});
					save(cache);
					if (changes)
						return ctx.reply('Opération effectuée avec succès.');
					else 
						return ctx.reply('Aucune modification n\'a été effectuée.');
				}
				
			} catch(e){
				console.log(e.message);
				return ctx.message("Une erreur est survenue");
			}
		} else {
			return usage(ctx);
		}
	}
}

var Notify = function (){
	//console.log('Notify function started ')
	hour = moment().get('hour');
	minute = moment().get('minute');
	cache = load()
	if (cache != null){
		cache.forEach(function(item){
			t = moment(item.time, 'HH:mm');
			if (hour == t.get('hour') && minute == t.get('minute')){
				cmd = item.cmd;
				data = cmd.split(' ');
				//console.log(data)
				API.getDest(data[0], data[1])
				.then(function(directions){
					Promise.all([
						API.getData(data[0], data[1], data[2], directions[0]),
						API.getData(data[0], data[1], data[2], directions[1])
					])
					.then(([res1, res2]) => {
						res = res1.concat(res2);
						bot.telegram.sendMessage(item.userid, res.join('\n'));
					})
			
				});
			}
		});
	}
}

//DB FUNCTIONS
var save = function(data) {
	fs.writeFile("data/cache.json", JSON.stringify(data), function(err){
		if(err){ console.log(err); }
	});
};

var load = function(){
	if(fs.existsSync("data/cache.json")) {
		try {
			return require('./data/cache.json');
		} catch (e){
			return null;
		}
	} else {
		return null;
	}
}

// TOOLS FUNCTIONS
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

function in_array(needle, haystack) {
    for(var i in haystack) {
        if(haystack[i] == needle) return true;
    }
    return false;
}




setInterval(Notify,60000);

bot.startPolling()
