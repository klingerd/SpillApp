var gulp = require('gulp'),
  cleanCSS = require('gulp-clean-css'),
  uglify = require('gulp-uglify'),
  del = require('del'),
  rename = require('gulp-rename'),
  jshint = require('gulp-jshint'),
  plumber = require('gulp-plumber'),
  sass = require('gulp-sass');
  autoprefix = require('gulp-autoprefixer');

gulp.task('delete', function() {
  del(['js/*.min.js','css/*.css'], function(err) {
    console.log('Files deleted');
  })
});

gulp.task('style', function () {
  return gulp
    .src('./css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'))
    .pipe(autoprefix())
    .pipe(cleanCSS())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./css'));
});

gulp.task('css', function() {
  return gulp
    .src(['css/*.css', '!css/*.min.css'])
    .pipe(autoprefix())
    .pipe(cleanCSS())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./css/'));
});

gulp.task('script', function() {
  return gulp
    .src(['js/**/*.js','!js/**/*.min.js'])
    .pipe(plumber())
    .pipe(uglify())
    .pipe(jshint())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./js'));
});

gulp.task('watch', function() {
  gulp.watch('css/**/*.scss', ['style']);
  gulp.watch(['js/**/*.js','!js/**/*.min.js'], ['script']);
});

gulp.task('default', ['delete', 'style', 'script', 'watch']);
