const del = require('del');

const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

// General
// const concat = require('gulp-concat');
// const flatmap = require('gulp-flatmap');
const lazypipe = require('lazypipe');
// const merge = require('merge-stream');
// const mergeJson = require('gulp-merge-json');
const wrap = require('gulp-wrap');
const { src, dest, series, task, watch, parallel } = require('gulp');

// const browserSync = require('browser-sync');
// const header = require('gulp-header');
// const nodemon = require('nodemon');

// Source
// const buffer = require('gulp-buffer');
// const rollupStream = require('@rollup/stream');
// const rollupTypescript = require('@rollup/plugin-typescript');
// const source = require('vinyl-source-stream');

// HTML
const gulpHtmlmin = require('gulp-htmlmin');

// Styles
const minify = require('cssnano');
const postcss = require('gulp-postcss');
const prefix = require('autoprefixer');
const sass = require('gulp-sass')(require('node-sass'));

// Markdown-It
// const cheerio = require('gulp-cheerio');
// const markdownIt = require('gulp-markdownit');
// const markdownitContainer = require('markdown-it-container');
// const markdownitInlineComments = require('markdown-it-inline-comments');
// const md = require('markdown-it')();

// Constants
const docsUrl = 'https://epdoc.github.io/epdoc-node-red-hassio';
const editorFilePath = 'dist';
const uiCssWrap = '<style><%= contents %></style>';
const uiJsWrap = '<script type="text/javascript"><%= contents %></script>';
const uiFormWrap = '<script type="text/html" data-template-name="<%= data.type %>"><%= data.contents %></script>';
const uiHelpWrap = '<script type="text/html" data-help-name="<%= data.type %>"><%= data.contents %></script>';
const resourcePath = 'resources/node-red-contrib-home-assistant-websocket';
const resourceFiles = [
  `<script src="${resourcePath}/select2.full.min.js?v=4.1.0-rc.0"></script>`,
  `<link rel="stylesheet" href="${resourcePath}/select2.min.css?v=4.1.0-rc.0">`,
  `<script src="${resourcePath}/maximize-select2-height.min.js?v=1.0.4"></script>`
];

// Compile sass and wrap it
const buildSass = lazypipe()
  .pipe(sass, {
    outputStyle: 'expanded',
    sourceComments: true
  })
  .pipe(postcss, [
    prefix({
      cascade: true,
      remove: true
    }),
    minify({
      discardComments: {
        removeAll: true
      }
    })
  ])
  .pipe(wrap, uiCssWrap);

const buildForm = lazypipe()
  .pipe(gulpHtmlmin, {
    collapseWhitespace: true,
    minifyCSS: true
  })
  .pipe(() => wrap(uiFormWrap, { type: nodeMap[currentFilename].type }, { variable: 'data' }));

const buildEditor = lazypipe()
  .pipe(gulpHtmlmin, {
    collapseWhitespace: true,
    minifyCSS: true
  })
  .pipe(() => wrap(uiFormWrap, { type: editorMap[currentFilename] }, { variable: 'data' }));

task('buildSourceFiles', () => {
  return tsProject.src().pipe(tsProject()).js.pipe(dest(editorFilePath));
});

// Clean generated files
task('cleanAssetFiles', (done) => {
  del.sync(['dist/icons', 'dist/locales']);

  done();
});

task('cleanSourceFiles', (done) => {
  del.sync(['dist/helpers', 'dist/homeAssistant', 'dist/nodes', 'dist/*.js']);

  done();
});

task('cleanEditorFiles', (done) => {
  del.sync(['dist/index.html']);

  done();
});

task('cleanAllFiles', parallel(['cleanAssetFiles', 'cleanSourceFiles', 'cleanEditorFiles']));
