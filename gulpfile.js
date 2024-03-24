import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import sourcemaps from 'gulp-sourcemaps';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import htmlmin from 'gulp-htmlmin';
import terser from 'gulp-terser';
import rename from 'gulp-rename';
import nunjucks from 'gulp-nunjucks-render';

import dartSass from 'sass';
import mozjpeg from 'imagemin-mozjpeg';
import optipng from 'imagemin-optipng';
import svgo from 'imagemin-svgo';
import autoprefixer from 'autoprefixer';
import browserSync from 'browser-sync';
import cssnano from 'cssnano';
import { deleteAsync as del } from 'del';

const sass = gulpSass(dartSass);

// CONFIG
const config = {
  paths: {
    src: {
      html: './src/html',
      scss: './src/scss',
      img: './src/images',
      fonts: './src/fonts',
      js: './src/js',
    },

    dist: {
      root: './dist/',
      css: './dist/css',
      img: './dist/assets/images',
      fonts: './dist/assets/fonts',
      js: './dist/js',
    },
  },
};

// FUNCTIONS
const startServer = (done) => {
  browserSync.init({
    server: {
      baseDir: './dist/',
    },
    open: false,
  });
  done();
};

const reloadServer = (done) => {
  browserSync.reload();
  done();
}

const cleanDist = async (done) => {
  const deletedPaths = await del([config.paths.dist.root], { force: true });
  console.log('Files and directories that would be deleted:\n', deletedPaths.join('\n'));
  done();
}

const devCSS = () => {
  return gulp.src(`${config.paths.src.scss}/**/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      cssnano()
    ]))
    .pipe(sourcemaps.write('./'))
    .pipe(rename((path) => {
      path.dirname = '';
    }))
    .pipe(gulp.dest(config.paths.dist.css));
}

const devJS = () => {
  return gulp.src(`${config.paths.src.js}/*.js`)
    .pipe(sourcemaps.init())
    .pipe(terser())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.paths.dist.js));
}

const devHTML = () => {
  return gulp.src(`${config.paths.src.html}/pages/*.njk`)
    .pipe(nunjucks({
      path: [
              `${config.paths.src.html}/`,
              `${config.paths.src.img}/`,
            ]
    }))
    .pipe(gulp.dest(`${config.paths.dist.root}/`))
}

const buildHTML = () => {
  return gulp.src(`${config.paths.src.html}/*.njk`)
    .pipe(nunjucksCompile())
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(`${config.paths.dist.root}/`));
}

const optimizeImages = () => {
  return gulp.src(`${config.paths.src.img}/**/*.{png,jpg,svg}`)
    .pipe(imagemin([
      mozjpeg({quality: 75, progressive: true}),
      optipng({optimizationLevel: 5}),
      svgo({
        plugins: [
          {name: 'removeViewBox', active: true},
          {name: 'cleanupIDs', active: false},
        ],
      }),
    ]))
    .pipe(gulp.dest(config.paths.dist.img));
}

const copyFonts = () => {
  return gulp.src(`${config.paths.src.fonts}/**/*`)
    .pipe(gulp.dest(`${config.paths.dist.fonts}`));
}

// WATCHERS
const watch = () => {
  gulp.watch(`${config.paths.src.scss}/**/*.scss`, gulp.series(
    devCSS,
    reloadServer,
  ));
  gulp.watch(`${config.paths.src.js}/*.js`, gulp.series(
    devJS,
    reloadServer,
  ));
  gulp.watch(`${config.paths.src.html}/**/*.{html,njk}`, gulp.series(
    devHTML,
    reloadServer,
  ));
  gulp.watch(`${config.paths.src.img}/**/*.{png,jpg,svg}`, gulp.series(
    optimizeImages,
    reloadServer,
  ));
  gulp.watch(`${config.paths.src.fonts}/**/*`, gulp.series(
    copyFonts,
    reloadServer,
  ));
};

// TASKS
gulp.task('dev', gulp.series(
  cleanDist,
  gulp.parallel(
    devCSS,
    devJS,
    devHTML,
    optimizeImages,
    copyFonts,
  ),
  startServer,
  watch,
));
