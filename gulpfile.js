'use strict';

// All used modules.
var babel = require('gulp-babel'),
    gulp = require('gulp'),
    runSeq = require('run-sequence'),
    plumber = require('gulp-plumber'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    livereload = require('gulp-livereload'),
    minifyCSS = require('gulp-minify-css'),
    ngAnnotate = require('gulp-ng-annotate'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    eslint = require('gulp-eslint'),
    mocha = require('gulp-mocha'),
    karma = require('karma').server,
    istanbul = require('gulp-istanbul');

// Development tasks
// --------------------------------------------------------------

// Live reload business.
gulp.task('reload', function() {
    livereload.reload();
});

gulp.task('reloadCSS', function() {
    return gulp.src('./public/style.css').pipe(livereload());
});

gulp.task('lintJS', function() {

    return gulp.src(['./browser/js/**/*.js', './server/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());

});

gulp.task('buildJS', ['lintJS'], function() {
    return gulp.src(['./browser/js/app.js', './browser/js/**/*.js'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(concat('main.js'))
        .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./public'));
});

gulp.task('testServerJS', function() {
    return gulp.src('./tests/server/**/*.js', {
        read: false
    }).pipe(mocha({
        reporter: 'spec'
    }));
});

gulp.task('testServerJSWithCoverage', function(done) {
    gulp.src('./server/**/*.js')
        .pipe(istanbul({
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire())
        .on('finish', function() {
            gulp.src('./tests/server/**/*.js', {
                    read: false
                })
                .pipe(mocha({
                    reporter: 'spec'
                }))
                .pipe(istanbul.writeReports({
                    dir: './coverage/server/',
                    reporters: ['html', 'text']
                }))
                .on('end', done);
        });
});

gulp.task('testBrowserJS', function(done) {
    karma.start({
        configFile: __dirname + '/tests/browser/karma.conf.js',
        singleRun: true
    }, done);
});

gulp.task('buildCSS', function() {
    return gulp.src('./browser/scss/main.scss')
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(rename('style.css'))
        .pipe(gulp.dest('./public'));
});

gulp.task('seedDB', function() {

    users = [{
        email: 'testing@fsa.com',
        password: 'testing123'
    }, {
        email: 'joe@fsa.com',
        password: 'rainbowkicks'
    }, {
        email: 'obama@gmail.com',
        password: 'potus'
    }];

    dbConnected = require('./server/db');

    return dbConnected.then(function() {
        User = require('mongoose').model('User');
        return User.create(users);
    }).then(function() {
        process.kill(0);
    }).catch(function(err) {
        console.error(err);
    });

});

// --------------------------------------------------------------

// Production tasks
// --------------------------------------------------------------

gulp.task('buildCSSProduction', function() {
    return gulp.src('./browser/scss/main.scss')
        .pipe(sass())
        .pipe(rename('style.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./public'))
});

gulp.task('buildJSProduction', function() {
    return gulp.src(['./browser/js/app.js', './browser/js/**/*.js'])
        .pipe(concat('main.js'))
        .pipe(babel())
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(gulp.dest('./public'));
});

gulp.task('buildProduction', ['buildCSSProduction', 'buildJSProduction']);

// --------------------------------------------------------------

// Composed tasks
// --------------------------------------------------------------

gulp.task('build', function() {
    if (process.env.NODE_ENV === 'production') {
        runSeq(['buildJSProduction', 'buildCSSProduction']);
    } else {
        runSeq(['buildJS', 'buildCSS']);
    }
});

gulp.task('default', function() {

    livereload.listen();
    gulp.start('build');

    gulp.watch('browser/js/**', function() {
        runSeq('buildJS', 'reload');
    });

    gulp.watch('browser/scss/**', function() {
        runSeq('buildCSS', 'reloadCSS');
    });

    gulp.watch('server/**/*.js', ['lintJS']);

    // Reload when a template (.html) file changes.
    gulp.watch(['browser/**/*.html', 'server/app/views/*.html'], ['reload']);

    // Run server tests when a server file or server test file changes.
    gulp.watch(['tests/server/**/*.js'], ['testServerJS']);

    // Run browser testing when a browser test file changes.
    gulp.watch('tests/browser/**/*', ['testBrowserJS']);

});
