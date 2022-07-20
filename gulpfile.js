const { series, src, dest, watch, task } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const rev = require('gulp-rev');
const clean = require('gulp-clean');
const postcss = require('gulp-postcss');
const browserify = require('browserify');
const path = require('path');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const glob = require('glob');
const es = require('event-stream');
const pkg = require('./package.json');
const shake = require('tinyify');
const merge = require('merge-stream');
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const tailwindcss = require("tailwindcss");

// Javascript Runners
function handleSetup() {
    return src(['src/js/modules/*.js', 'src/js/custom.js'], { allowEmpty: true }).pipe(dest('src/js/processed'));
}

function handleBrowserify(done) {
    glob('src/js/processed/*.js', function (err, files) {
        if (err) done(err);
        let tasks = files.map(function (entry) {
            return browserify({
                entries: [entry],
                sourceType: 'module',
                paths: ['./node_modules', './src/js/modules/es6'],
            })
                .plugin(shake, { flat: false })
                .transform(babelify.configure({ presets: ['@babel/env'] }))
                .bundle()
                .pipe(source(path.resolve(entry), path.resolve('src/js/processed')))
                .pipe(dest('public_html/dist'));
        });
        es.merge(tasks).on('end', done);
    });
}

// CSS Runners
function handleSass() {
    return src(['src/css/styles.scss', 'src/css/modules/*.scss'], {
        allowEmpty: true,
    })
        .pipe(sass().on('error', sass.logError))
        .pipe(dest('src/css/processed'));
}

function handlePostcss() {
    return src('src/css/processed/*.css').pipe(postcss()).pipe(dest('public_html/dist'));
}

// Misc Runners
function handleRev() {
    return src(['public_html/dist/*.css', 'public_html/dist/*.js'])
        .pipe(rev())
        .pipe(dest('public_html/dist'))
        .pipe(rev.manifest())
        .pipe(dest('public_html/dist'));
}

function handleRevWatch() {
    return src(['public_html/dist/*.css', 'public_html/dist/*.js', '!public_html/dist/layout.css'])
        .pipe(rev())
        .pipe(dest('public_html/dist'))
        .pipe(rev.manifest())
        .pipe(dest('public_html/dist'));
}

function handleCleanWatch() {
    return src(
        [
            'public_html/dist/*',
            '!public_html/dist/images',
            '!public_html/dist/layout.css',
            'src/css/processed/*',
            'src/js/processed/*',
        ],
        {
            read: false,
            allowEmpty: true,
        }
    ).pipe(clean());
}

function handleClean() {
    return src(['public_html/dist/*', '!public_html/dist/layout.css', 'src/css/processed/*', 'src/js/processed/*'], {
        read: false,
        allowEmpty: true,
    }).pipe(clean());
}

function handleWatch() {
    watch(
        [
            'src/js/**/*.js',
            '!src/js/processed/**/*.js',
            'src/css/**/*.{css,scss}',
            '!src/css/onbuy.css',
            '!src/css/processed/*.css',
        ],
        series(handleCleanWatch, handleSass, handlePostcss, handleSetup, handleBrowserify, handleRevWatch),
        { allowEmpty: true }
    );
}


exports.default = series(handleClean, handleSass, handlePostcss, handleSetup, handleBrowserify, handleRev);

exports.watch = handleWatch;
