var argv = require('yargs').argv,
	imgur = require('./lib/imgur'),
	_ = require("lodash"),
	Promise = require("bluebird"),
	fs = require("fs"),
	path = require("path");

// Promisify FS
Promise.promisifyAll(fs);

// Validate inputs
if (_.isEmpty(argv.subreddit)) {
	console.error("You must provide a subreddit to use!");
	return process.exit(1);
}

if (_.isEmpty(argv.location)) {
	console.error("You must provide a download location!");
	return process.exit(1);
}

var pages = argv.pages || 1,
	timeframe = argv.timeframe,
	location = path.resolve(path.normalize(argv.location)),
	ids = [];

// Verify the download location is legit
try {
	var stats = fs.lstatSync(location);

	if ( ! stats.isDirectory()) {
		console.error("Download location must be a directory");
		return process.exit(1);
	}
}
catch (e) {
	console.error(e);
	return process.exit(1);
}

// Get a list of file IDs to prevent duplicate downloads
fs.readdirAsync(location).then(function (files) {
	var stats = {};

	// Load the stats of the files
	for (var i = files.length - 1; i >= 0; i--) {
		ids.push(path.parse(path.join(location, files[i])).name);
	}

	return imgur.getTopImagesFromSubreddit(argv.subreddit, pages, timeframe);
})

.then(function (data) {
	// TODO: Only download the new stuff
	var pending = [];

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
		if (_.includes(ids, data[i].id)) {
			console.info("Skipping duplicate image " + data[i].id);
			continue;
		}

		pending.push(imgur.downloadImage(data[i].id, location));
	}
	
	return Promise.all(pending);
})

.then(function (data) {
	console.info("Retrieved "+data.length+" images.");
})
.catch(function (err) {
	console.error(err);
	return process.exit(1);
});