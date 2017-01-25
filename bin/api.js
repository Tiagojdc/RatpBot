var promise = require('promise')

	
exports.getLines = function(typeLine){
	return new Promise(
		function(resolve, reject){
			var urlLines = 'https://api-ratp.pierre-grimaud.fr/v2/'+typeLine+'/';
			https.get(urlLines, (res) => {
				let rawData = '';
				res.on('data', (chunk) => rawData += chunk);
				res.on('end', () => {
					try {
						let linesData = JSON.parse(rawData);
						LineArray = []
						linesData.response[typeLine].forEach(function(item){
								LineArray.push('/'+typeLine+' '+item.line)
								//console.log(item)
						});
						resolve(LineArray)
					} catch (e) {
						console.log(e.message);
						reject(e);
					}
				})
			}).on('error', (e) => {
				console.log('Got error: ${e.message}');
				reject(e);
			});
		}
	)
}

exports.getStations = function(typeLine, lineId){
	return new Promise(
		function(resolve, reject){
			var urlLines = 'https://api-ratp.pierre-grimaud.fr/v2/'+typeLine+'/'+lineId+'/stations/';
			https.get(urlLines, (res) => {
				let rawData = '';
				res.on('data', (chunk) => rawData += chunk);
				res.on('end', () => {
					try {
						let linesData = JSON.parse(rawData);

						stationArray = []
						linesData.response.stations.forEach(function(item){
								stationArray.push('/'+typeLine+' '+lineId+' '+item.slug.replace(/\+/g, ' '))
						});
						resolve(stationArray)
					} catch (e) {
						console.log(e.message);
						reject(e);
					}
				})
			}).on('error', (e) => {
				console.log('Got error: ${e.message}');
				reject(e);
			});
		}
	)
}

exports.getDest = function(typeLine, line){
	return new Promise(
		function(resolve, reject){
			var urlLines = 'https://api-ratp.pierre-grimaud.fr/v2/'+typeLine+'/';
			https.get(urlLines, (res) => {
				let rawData = '';
				res.on('data', (chunk) => rawData += chunk);
				res.on('end', () => {
					try {
						let linesData = JSON.parse(rawData);
						let direction = undefined;
						linesData.response[typeLine].forEach(function(item){
							if (item.line == line){
								direction = item.destinations;
							}
						});
						resolve(direction)
					} catch (e) {
						console.log(e.message);
						reject(e);
					}
				})
			}).on('error', (e) => {
				console.log('Got error: ${e.message}');
				reject(e);
			});
		}
	)
	
}
exports.getData = function(typeLine, line, station, dir){
	return new Promise(
		function(resolve, reject){
			url = 'https://api-ratp.pierre-grimaud.fr/v2/'+typeLine+'/'+line+'/stations/'+station+'?destination='+dir.id;

			https.get(url, (res) => {
				let rawData = '';
				res.on('data', (chunk) => rawData += chunk);
				res.on('end', () => {
					try {
						let data1 = JSON.parse(rawData);
						//console.log(data1.response.schedules);
						var arrayStr = []
						data1.response.schedules.forEach(function(item){
							arrayStr.push('Destination : '+item.destination + ' - ' + item.message);
						})
						resolve(arrayStr);
					} catch (e) {
						console.log(e.message);
						reject(e);
					}
				})
			}).on('error', (e) => {
				console.log(`Got error: ${e.message}`);
				reject(e);
			});
		}
	)
}