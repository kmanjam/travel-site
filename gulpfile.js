const { watch, series, parallel, src, dest } = require('gulp');
const browserSync = require('browser-sync').create();
const Autoprefixer = require('gulp-autoprefixer');
const postcss = require('gulp-postcss');
const Cssvars = require('postcss-simple-vars');
const cssNested = require('postcss-nested');
const cssImport = require('postcss-import');
const mixins = require('postcss-mixins');
const svgSprite = require('gulp-svg-sprite');
const rename = require('gulp-rename');
const del = require('del');
const hexRgba = require('postcss-hexrgba');
const webpack = require('webpack');
const svg2png = require('gulp-svg2png');


// var myModernizr = require('gulp-modernizr');
// var usemin = require('gulp-usemin');
// var imagemin = require('gulp-imagemin');

// Custom Webpack DevMiddleware ** Live Reload Not working for JS files... ** //
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');

// Custom gulp build of modernizr ** Not working ** //
// **try this link instead: https://modernizr.com/download?setclasses //

// function myModernizr() {
//     return src(['./app/assets/styles/**/*.css', './app/dist/**/*.js'])
//     .pipe(modernizr({
//         "options": [
//             "setClasses"
//         ]
//     }))
//     .pipe(dest('./app/dist/'));
// }

// *** Sprites Magic *** //

var config = {
    shape: {
        spacing: {
            padding: 1
        }
    },
    mode: {
        css: {
            variables: {
                replaceSVGwithPng: function() {
                    return function(sprite, render) {
                        return render(sprite).splt('.svg').join('.png');
                    }
                }
            },
            sprite: 'sprite.svg',
            render: {
                css: {
                    template: './gulp/templates/sprite.css'
                }
            }
        }
    }
}

function beginClean() {
    return del(['./app/temp/sprite', './app/asset/images/sprites']);
}

function createSprite() {
    return src('./app/assets/images/icons/**/*.svg')
    .pipe(svgSprite(config))
    .pipe(dest('./app/temp/sprite/'));
}

function createPngCopy() {
    return src('./app/temp/sprite/css/*.svg')
    .pipe(svg2png())
    .pipe(dest('./app/temp/sprite/css'));
}

function copySpriteGraphic() {
    return src('./app/temp/sprite/css/**/*.{svg,png}')
        .pipe(dest('./app/assets/images/sprites'));
}

function copySpriteCss() {
    return src('./app/temp/sprite/css/*.css')
        .pipe(rename('_sprite.css'))
        .pipe(dest('./app/assets/styles/modules'));
}

function endClean() {
    return del(['./app/temp/sprite']);
}

// *** CSS Magic *** //

function css() {
    return src('app/assets/styles/styles.css')
    .pipe(postcss([cssImport, mixins, Cssvars, hexRgba, cssNested, Autoprefixer]))
    .on('error', function(errorInfo){
        console.log(errorInfo.toString());
        this.emit('end');
    })
    .pipe(dest('app/temp/styles'));
}

function cssInject() {
    return src('app/temp/styles/styles.css')
    .pipe(browserSync.stream());
}

// *** Compile JS files with Webpack *** //

// live reload scripts function

function scriptsRefresh() {
    browserSync.reload();
}

// run webpack with config file

function bundleScripts() {
    webpack(webpackConfig);
}

var webpackConfig = require('./webpack.config');
var bundler = webpack(webpackConfig);

// *** Live Reloads with browserSync server + gulp watch *** //

function serve() {

    browserSync.init({
        notify: false,
        server: {
            baseDir: "./app",
            middleware: [
                webpackDevMiddleware(bundler, {
                    publicPath: webpackConfig.output.publicPath,
                    stats: { colors: true }
                }),
                webpackHotMiddleware(bundler)
                        ]
                }
            });


      watch('app/index.html', function() {
        browserSync.reload();
    });

    watch('./app/assets/styles/**/*.css', series(css, cssInject));
    watch('./src/**/*.js', series(bundleScripts, scriptsRefresh));
    // watch('./src/**/*.js', function() {
    //     browserSync.reload();
    // });
}

// exports.scripts = scripts;
// exports.myModernizr = myModernizr;

exports.serve = serve;
exports.icons = series(beginClean, createSprite, createPngCopy, copySpriteGraphic, copySpriteCss, endClean);

// *** Automated Production build *** //

// function deleteProdFolder() {
//     return del("./prod");
// }

// function optimizeImages() {
//     return src(['./app/assets/images/**/*', '!./app/assets/images/icons', '!./app/assets/images/icons/**/*' ])
//     .pipe(imagemin({
//         progressive: true, // *helps with jpg files
//         interlaced: true, // *helps with png files
//         multipass: true // *helps with svg files
//     }))
//     .pipe(dest('./prod/assets/images'));
// }

// usemin is depreciated (use Webpack or Browserify instead)

// function usemin() {
//     return src('./app/index.html')
//     .pipe(usemin())
//     .pipe(dest('./prod'));
// }

// exports.prod = series(deleteProdFolder, optimizeImages, usemin);

