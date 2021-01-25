const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const csso = require("postcss-csso");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgstore = require("gulp-svgstore");
const htmlmin = require("gulp-htmlmin");
const uglify = require("gulp-uglify-es").default;
const del = require("del");
const sync = require("browser-sync").create();
const magicImporter = require("node-sass-magic-importer");

// Styles
const styles = () => {
    return gulp
        .src("source/sass/style.scss")
        .pipe(plumber())
        .pipe(sourcemap.init())
        .pipe(sass({importer: magicImporter()}).on("error", sass.logError))
        .pipe(postcss([autoprefixer(), csso()]))
        .pipe(sourcemap.write("."))
        .pipe(rename("style.min.css"))
        .pipe(gulp.dest("build/css"))
        .pipe(sync.stream());
};

exports.styles = styles;

// Images
const images = () => {
    return gulp
        .src("source/img/**/*.{jpg,png,svg}")
        .pipe(
            imagemin([
                imagemin.mozjpeg({progressive: true}),
                imagemin.optipng({optimizationLevel: 3}),
                imagemin.svgo(),
            ])
        )
        .pipe(gulp.dest("build/img"));
};

exports.images = images;

// WebP
const createWebp = () => {
    return gulp
        .src("source/img/**/*.{jpg,png}")
        .pipe(webp({quality: 90}))
        .pipe(gulp.dest("build/img"));
};

exports.createWebp = createWebp;

// Sprites
const sprite = () => {
    return gulp
        .src("source/img/icons/*.svg")
        .pipe(svgstore())
        .pipe(rename("sprite.svg"))
        .pipe(gulp.dest("build/img"));
};

exports.sprite = sprite;

// HTML
const html = () => {
    return gulp
        .src("source/*.html")
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest("build"));
};

// JS
const scripts = () => {
    return gulp
        .src("source/js/*.js")
        .pipe(uglify())
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest("build/js"))
        .pipe(sync.stream());
};

exports.scripts = scripts;

// Copy
const copy = () => {
    return gulp
        .src(
            [
                "source/fonts/*.{woff2,woff}",
                "source/*.ico",
                "source/img/**/*.{jpg,png,svg}",
            ],
            {
                base: "source",
            }
        )
        .pipe(gulp.dest("build"));
};

exports.copy = copy;

// Clean
const clean = () => {
    return del("build");
};

exports.clean = clean;

// Server
const server = (done) => {
    sync.init({
        server: {
            baseDir: "build",
        },
        cors: true,
        notify: false,
        ui: false,
    });
    done();
};

exports.server = server;

// Reload
const reload = (done) => {
    sync.reload();
    done();
};

// Watcher
const watcher = () => {
    gulp.watch("source/sass/**/*.scss", gulp.series("styles"));
    gulp.watch("source/js/*.js", gulp.series(scripts));
    gulp.watch("source/*.html", gulp.series(html, reload));
    gulp.watch("source/img/**/*.svg", gulp.series(sprite, reload));
};

// Build
const build = gulp.series(
    clean,
    gulp.parallel(styles, html, scripts, copy, createWebp),
    images,
    sprite
);

exports.build = build;

exports.default = gulp.series(
    clean,
    gulp.parallel(styles, html, copy, createWebp, scripts),
    sprite,
    gulp.series(server, watcher)
);
