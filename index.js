var yargs = require('yargs'),
	imgur = require('./lib/imgur'),
	_ = require("lodash"),
	Promise = require("bluebird"),
	fs = require("fs"),
	path = require("path");

// Setup Yargs
yargs.usage("Usage: $0 <subreddit> <location> [options]")
	.demand(2)
	.wrap(yargs.terminalWidth())
	.options({
		"p": {
			alias: "pages",
			default: 1,
			describe: "Number of pages to pull from Imgur. One page is 60 images."
		},
		"t": {
			alias: "timeframe",
			default: "all",
			describe: "Timeframe in which you want the top images.",
			choices: ["day", "week", "month", "year", "all"]
		},
		"w": {
			alias: "workers",
			default: 5,
			describe: "Number of workers to download concurrently."
		}
	});

var argv = yargs.argv;

// Promisify FS
Promise.promisifyAll(fs);

var subreddit = argv._[0],
	pages = argv.pages,
	timeframe = argv.timeframe,
	workers = argv.workers,
	location = path.resolve(path.normalize(argv._[1])),
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

	return imgur.getTopImagesFromSubreddit(subreddit, pages, timeframe);
})

.then(function (data) {
	// TODO: Only download the new stuff
	var queue = [], skipped = 0;

	console.info("Found " + data.length + " images.");

	for (var i = data.length - 1; i >= 0; i--) {
		// Skip low res images
		if (data[i].width < 1920 || data[i].height < 1080) {
			console.info("Skipping low res image " + data[i].id);
			skipped++;
			continue;
		}

		// Skip portrait image
		if (data[i].width < data[i].height) {
			console.info("Skipping portrait image " + data[i].id);
			skipped++;
			continue;
		}

		// Skip duplicates
		if (_.includes(ids, data[i].id)) {
			console.info("Skipping duplicate image " + data[i].id);
			skipped++;
			continue;
		}

		queue.push(data[i].id);
	}

	queue = _.uniq(queue);
	console.info("Skipped " + skipped + " images");
	console.info("Fetching " + queue.length + " images.");
	
	return processQueue(queue, workers);
})

.then(function (data) {
	console.info("Done.");
})
.catch(function (err) {
	console.error(err);
	return process.exit(1);
});

function processQueue(queue, workers) {
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
}

function processImage(id) {
	
}