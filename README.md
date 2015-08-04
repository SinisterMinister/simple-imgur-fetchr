# Simple Imgur Fetchr

Simple Imgur Fetchr is a node script that will download the top images for a subreddit from Imgur to a location of your choosing. You can tune the parallelism of the downloads as well as how many pages you wish to fetch.

## Usage

```text
Usage: node index.js <subreddit> <location> [options]

Options:
  -p, --pages      Number of pages to pull from Imgur. One page is 60 images.   [default: 1]
  -t, --timeframe  Timeframe in which you want the top images.              [default: "all"]
  -w, --workers    Number of workers to download concurrently.                  [default: 5]
```

By default, the script will download the top 60 images of all time for a subreddit.

#### Get top 60 of all time from r/pics

```text
$ node index.js pics /home/user/pics
```

This will download the top 60 images of all time and place them into the `/home/user/pics` directory.

#### Get the top 120 images for the last month from r/pics

```text
$ node index.js pics /home/user/pics -p 2 -t month
```

#### Get the top 120 images for the last week one image at a time

```text
$ node index.js pics /home/user/pics -p 2 -t week -w 1
```