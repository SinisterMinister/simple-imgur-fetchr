var imgur = require('./imgur'),
	_ = require("lodash"),
	Promise = require("bluebird"),
	fs = require("fs"),
	path = require("path");

// Promisify FS
Promise.promisifyAll(fs);

var api = {}, privateApi = {};

// Prepare the modules
module.exports = api;

api.fetchImages = function (subreddit, location, pages, timeframe, workers) {

	return new Promise(function (resolve, reject) {

		// Verify the location
		privateApi.verifyLocation(location)

		// Get the existing ids
		.then(privateApi.getExistingImageIds)

		// Fetch and prune the list of images to download from Imgur
		.then(function (ids) {
			return privateApi.fetchAndPruneImageIds(ids, subreddit, pages, timeframe);
		})

		// Download the images
		.then(function (queue) {
			return privateApi.downloadImages(location, queue, workers);
		})

		// Return control
		.then(resolve, reject);
	});
};

privateApi.verifyLocation = function (location) {
	return new Promise(function (resolve, reject) {
		fs.lstatAsync(location).then(function (stats) {
			if ( ! stats.isDirectory()) {
				return reject(new Error("Download location must be a directory"));
			}
			return location;
		}).then(resolve, reject);
	});
};

privateApi.getExistingImageIds = function (location) {
	return new Promise(function (resolve, reject) {
		// Get a list of file IDs to prevent duplicate downloads
		fs.readdirAsync(location).then(function (files) {
			var ids = [];

			// Load the stats of the files
			for (var i = files.length - 1; i >= 0; i--) {
				ids.push(path.parse(path.join(location, files[i])).name);
			}

			return ids;
		}).then(resolve, reject);
	});
};

privateApi.fetchAndPruneImageIds = function (existingImages, subreddit, pages, timeframe) {
	return new Promise(function (resolve, reject) {
		// Get the list of images from Imgur
		imgur.getTopImagesFromSubreddit(subreddit, pages, timeframe)

		// Prune the list by removing low res, portrait, and duplicate images
		.then(function (data) {
			var queue = [];

			console.info("Found " + data.length + " images.");

			for (var i = data.length - 1; i >= 0; i--) {
				// Skip low res images
				if (data[i].width < 1920 || data[i].height < 1080) {
					console.info("Skipping low res image " + data[i].id);
					continue;
				}

				// Skip portrait image
				if (data[i].width < data[i].height) {
					console.info("Skipping portrait image " + data[i].id);
					continue;
				}

				// Skip duplicates
				if (_.includes(existingImages, data[i].id)) {
					console.info("Skipping duplicate image " + data[i].id);
					continue;
				}

				queue.push(data[i].id);
			}

			queue = _.uniq(queue);
			console.info("Skipped " + (data.length - queue.length) + " images");
			console.info("Fetching " + queue.length + " images.");

			return queue;
		})

		// Return the pruned list of images
		.then(resolve, reject);
	});
};

privateApi.downloadImages = function (location, queue, workers) {
	var processImage = function () {
		return new Promise(function (resolve, reject) {
			if (queue.length > 0)
				imgur.downloadImage(queue.shift(), location).then(function () {
					processImage().then(resolve, reject);
				}).catch(reject);
			else
				resolve();
		});
	};

	return new Promise(function (resolve, reject) {
		for (var i = workers - 1; i >= 0; i--) {
			processImage().then(resolve, reject);
		}
	});
};