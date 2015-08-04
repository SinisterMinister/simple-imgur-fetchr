#! /usr/bin/env node

var yargs = require('yargs'),
	path = require("path"),
	core = require("./lib/core");

// Setup Yargs
var argv = yargs.usage("Usage: simple-imgur-fetchr <subreddit> <location> [options]")
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
	}).argv;

// Extract and normalize arguments
var subreddit = argv._[0],
	pages = argv.pages,
	timeframe = argv.timeframe,
	workers = argv.workers,
	location = path.resolve(path.normalize(argv._[1])),
	ids = [];

// Do the work
core.fetchImages(subreddit, location, pages, timeframe, workers).then(function () {
	console.info("Download complete!");
	process.exit();
}).catch(function (err) {
	console.info(err);
	process.exit(1);
});