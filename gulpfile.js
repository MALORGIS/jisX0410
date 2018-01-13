
let gulp = require('gulp');
let pug = require('gulp-pug');
let data = require('gulp-data');

let cleanCSS = require('gulp-clean-css');

let watch = require('gulp-watch');


gulp.task("watch", function () {
  var targets = [
    './views/**/*.pug', './views/**/*.css'
  ];
  var watcher = watch(targets, function () {
    gulp.start('default');
  });
});

gulp.task('templates', function () {
  
  gulp.src(['./views/**/*.pug', '!./views/**/_*.pug'])
    .pipe(data(function (file) {
      var json = {};
      String(file.contents).split(/\r\n|\r|\n/).forEach(function (line) {
        if (line.match(/^\/\/\-\s*?data\s+?((\w+)\.json)$/)) {
          json[RegExp.$2] = require("./Views/" + RegExp.$1);
        }
      });
      return { data: json };
    }))
    .pipe(pug({
      pretty: false
    }))
    .pipe(gulp.dest('./docs/'))
});

var rimraf = require('rimraf');

gulp.task('cleanDocs', function (cb) {
  rimraf('./docs/jisX0410', cb);
});

// ソースコードをdocsに移す
gulp.task('copy2docs', ['cleanDocs'] , function (){
  gulp.src(['./src/**/*.ts', './src/**/*.js', './src/**/*.map'])
    .pipe(gulp.dest('./docs/jisX0410'))
});


gulp.task('min-css', () => {
  return gulp.src('./views/**/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('./css/'));
});


gulp.task('default', ['templates', 'min-css']);