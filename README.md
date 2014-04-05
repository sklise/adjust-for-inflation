# Inflation Calculator

http://inflation.skli.se

A website for calculating buying power of the United States dollar from 1913 to present. An experiment with [React][1]

## Running

This site is built with [Gulp][2] and [Harp][3]. You'll need Node.js as well. Once you have Node installed, run the following:

```
npm install gulp -g
npm install harp -g
```

Then from within the directory of this project, run

```
npm install -d
```

to install the development dependencies.

There are 3 scripts:

- `npm run start` : Starts up the Harp server on localhost:9000
- `npm run build` : Compiles the site to `_site/`
- `npm run publish` : Publishes the site to Amazon S3, you must first have a `.env` file with `S3_KEY` and `S3_SECRET`.

## Data Source

CPI data was retrieved from the [Bureau of Labor Statistics][4], Series [CUUR0000AA0][5].

[1]: http://facebook.github.io/react
[2]: http://gulpjs.com
[3]: http://harpjs.com
[4]: http://data.bls.gov/timeseries/CUUR0000SA0?output_view=pct_1mth
[5]: http://download.bls.gov/pub/time.series/cu/cu.data.1.AllItems