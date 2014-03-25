var gulp = require("gulp");
var awspublish = require('gulp-awspublish');
var harp = require('harp');
var mkdirp = require('mkdirp');
var dotenv = require('dotenv');
dotenv.load();

gulp.task('server', function () {
  harp.server('./',{port:9000})
});

gulp.task('build', function () {
  mkdirp("./_site", function (err) {
    if (err) return console.log(err);

    return harp.compile(".","_site/", console.log);
  });
});

gulp.task('publish', function() {

  // create a new publisher
  var publisher = awspublish.create({
    key: process.env.S3_KEY,
    secret: process.env.S3_SECRET,
    bucket: 'inflation.skli.se'
  });

  // define custom headers
  var headers = {
     'Cache-Control': 'max-age=315360000, no-transform, public'
     // ...
   };

  return gulp.src('./_site/**/**')
    // publisher will add Content-Length, Content-Type and Cache-Control headers
    // and if not specified will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers))
     // print upload updates to console
    .pipe(awspublish.reporter());
});

gulp.task('default', ['build', 'publish']);