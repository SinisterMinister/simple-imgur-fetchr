# Simple Imgur Fetchr [![npm version](https://badge.fury.io/js/simple-imgur-fetchr.svg)](http://badge.fury.io/js/simple-imgur-fetchr)

Simple Imgur Fetchr is a node script that will download the top images for a subreddit from Imgur to a location of your choosing. You can tune the parallelism of the downloads as well as how many pages you wish to fetch.

## Installation

To install, you must first have npm installed on your machine.

```shell
$ npm install -g simple-imgur-fetchr
```

## Usage

```text
Usage: simple-imgur-fetchr <subreddit> <location> [options]

Options:
  -p, --pages       Number of pages to pull from Imgur. One page is 60 images.     [default: 1]
  -t, --timeframe   Timeframe in which you want the top images.                [default: "all"]
  -w, --workers     Number of workers to download concurrently.                    [default: 5]
  --allowPortraits  Download portrait images                         [boolean] [default: false]
  --allowLowRes     Download images that are smaller than 1920x1080  [boolean] [default: false]
```

By default, the script will download the top 60 images of all time for a subreddit.

#### Get top 60 of all time from r/pics

```text
$ simple-imgur-fetchr pics /home/user/pics
```

This will download the top 60 images of all time and place them into the `/home/user/pics` directory.

#### Get the top 120 images for the last month from r/pics

```text
$ simple-imgur-fetchr pics /home/user/pics -p 2 -t month
```

#### Get the top 120 images for the last week one image at a time

```text
$ simple-imgur-fetchr pics /home/user/pics -p 2 -t week -w 1
```