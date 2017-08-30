import gulp from 'gulp';
import del from 'del';
import rename from 'gulp-rename';
import cleanCSS from 'gulp-clean-css';
import plumber from 'gulp-plumber';
import sass from 'gulp-sass';
import autoprefix from 'gulp-autoprefixer';

import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import eslint from 'gulp-eslint';
import exorcist from 'exorcist';
import browserSync from 'browser-sync';
import watchify from 'watchify';
import babelify from 'babelify';
import uglify from 'gulp-uglify';

watchify.args.debug = true;  

const sync = browserSync.create(); 

// Input file.
watchify.args.debug = true;
var bundler = browserify('js/index.js', watchify.args);

// Babel transform
bundler.transform(babelify.configure({
  sourceMapRelative: 'js'
}));

// On updates recompile
bundler.on('update', bundle);

function bundle() {
  return bundler.bundle()
    .on('error', function(error){
      console.error( '\nError: ', error.message, '\n');
      this.emit('end');
    })
    .pipe(exorcist('/js/bundle.js.map'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('js'));
}


gulp.task('default', ['delete', 'style', 'transpile', 'watch']);

gulp.task('delete', () => {
  del(['js/bundle.js','css/*.css'], function(err) {
    console.log('Deleting Files ');
    console.error('\nError: ', err.message, '\n');
  })
});

gulp.task('style', () => {
  return gulp
    .src('./css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'))
    .pipe(autoprefix())
    .pipe(cleanCSS())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./css'));
});

gulp.task('transpile', ['lint'], () => bundle());

gulp.task('lint', () => {
    return gulp.src(['src/**/*.js', 'gulpfile.babel.js'])
      .pipe(plumber())
      .pipe(eslint())
      .pipe(eslint.format())
});

gulp.task('serve', ['transpile'], () => sync.init({ server: '.' }))
gulp.task('js-watch', ['transpile'], () => sync.reload());

gulp.task('watch', ['serve'], () => {
  gulp.watch('css/**/*.scss', ['style']);
  gulp.watch('css/*.min.css', sync.reload);
  gulp.watch(['js/**/*.js','!js/bundle.js'], ['transpile']);
  gulp.watch('index.html', sync.reload);
});





gulp.task('css', () => {
  return gulp
    .src(['css/*.css', '!css/*.min.css'])
    .pipe(autoprefix())
    .pipe(cleanCSS())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./css/'));
});
