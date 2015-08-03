var request = require("request-promise"),
	Promise = require("bluebird"),
	_ = require("lodash"),
	fs = require("fs"),
	path = require("path");

// Constants
var CLIENT_ID = "2b6ce0b6831ea9e";

var api = {},
	imgurApiReq = request.defaults({
		headers: {
			"Authorization": "Client-Id " + CLIENT_ID
		},
		json: true
	}),
	validTimeframes = ["day", "week", "month", "year", "all"];

api.getTopImagesFromSubreddit = function (subreddit, howManyPages, timeframe) {
	return new Promise(function (resolve, reject) {
		if ( ! _.isString(subreddit)) {
			return reject(new Error("No subreddit provided"));
		}
		
		// Normalize fields
		howManyPages = _.isNumber(howManyPages) ? howManyPages : 1;
		timeframe = _.isEmpty(timeframe) ? "week" : timeframe;

		if ( ! _.includes(validTimeframes, timeframe)) {
			reject(new Error("Invalid timeframe provided"));
		}

		// Container for requests
		var pending = [], ret = [];

		// Retrieve the pages
		for (var page = howManyPages - 1; page >= 0; page--) {
			pending.push(imgurApiReq.get("https://api.imgur.com/3/gallery/r/" + subreddit + "/top/" + timeframe + "/" + howManyPages));
		}

		Promise.all(pending).then(function (results) {
			// Extract the data
			for (var i = results.length - 1; i >= 0; i--) {
				if  (results[i].data === undefined)
					continue;

				// Combine the data from the requests
				ret = _.union(ret, results[i].data);
			}

			// Return the data
			resolve(ret);
		}).catch(reject);
	});
};

api.getImageData = function (imageId) {
	return imgurApiReq.get("https://api.imgur.com/3/image/" + imageId);
};

api.downloadImage = function (imageId, downloadLocation) {
	return new Promise(function (resolve, reject) {
		// Validate fields
		if (_.isEmpty(imageId))
			return reject(new Error("No imageId provided"));
		if (_.isEmpty(downloadLocation))
			return reject(new Error("No downloadLocation provided"));

		// Container for file name
		var filename;

		// Retrieve the image metadata
		api.getImageData(imageId)

		// Use metadata to get download link and download the image
		.then(function (response) {
			if (_.isEmpty(response) || response.data === undefined || _.isEmpty(response.data.link)) {
				return reject(new Error("Response from service was malformed. Could not retrieve download link."));
			}

			// Build the file name
			filename = imageId;

			switch (response.data.type) {
				case "image/png":
					filename+= ".png";
					break;
				case "image/gif":
					filename+= ".gif";
					break;
				case "image/jpeg":
					filename+= ".jpg";
					break;
			}

			// Write the file
			
			var file = fs.createWriteStream(path.join(downloadLocation, filename));

			console.info("Downloading "+response.data.link);
			
			return request.get(response.data.link).pipe(file);
		})

		.then(resolve)

		// Catch any errors
		.catch(reject);
	});
};

module.exports = api;