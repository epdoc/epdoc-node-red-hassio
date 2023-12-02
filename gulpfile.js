const del = require('del');

const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

// General
const concat = require('gulp-concat');
const flatmap = require('gulp-flatmap');
const lazypipe = require('lazypipe');
const merge = require('merge-stream');
const mergeJson = require('gulp-merge-json');
const wrap = require('gulp-wrap');
const { src, dest, series, task, watch, parallel } = require('gulp');

// const browserSync = require('browser-sync');
const header = require('gulp-header');
// const nodemon = require('nodemon');

// Source
const buffer = require('gulp-buffer');
const rollupStream = require('@rollup/stream');
const rollupTypescript = require('@rollup/plugin-typescript');
const source = require('vinyl-source-stream');

// HTML
const gulpHtmlmin = require('gulp-htmlmin');

// Scripts
const terser = require('gulp-terser');

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
const resourcePath = 'resources/epdoc-node-red-hassio';
const resourceFiles = [
  `<script src="${resourcePath}/select2.full.min.js?v=4.1.0-rc.0"></script>`,
  `<link rel="stylesheet" href="${resourcePath}/select2.min.css?v=4.1.0-rc.0">`,
  `<script src="${resourcePath}/maximize-select2-height.min.js?v=1.0.4"></script>`
];

const nodeMap = {
  'fan-control': { doc: 'fan-control', type: 'fan-control' },
  'lower-case': { doc: 'lower-case', type: 'ha-number' }
};

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

// Shrink js and wrap it
const buildJs = lazypipe().pipe(terser).pipe(wrap, uiJsWrap);

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

const buildEditorFiles = (done) => {
  const css = src(['src/editor/css/**/*.scss', 'src/nodes/**/*.scss', '!_*.scss']).pipe(buildSass());

  // let cache;
  // const js = rollupStream({
  //   input: 'src/editor.ts',
  //   cache,
  //   output: {
  //     dir: editorFilePath,
  //     format: 'iife'
  //   },
  //   plugins: [
  //     rollupTypescript({
  //       tsconfig: 'tsconfig.editor.json'
  //     })
  //   ],
  //   external: []
  // })
  //   .on('bundle', (bundle) => {
  //     cache = bundle;
  //   })
  //   .pipe(source('editor.ts'))
  //   .pipe(buffer())
  //   .pipe(buildJs());

  // const editorsHtml = src(['src/editor/editors/*.html']).pipe(
  //   flatmap((stream, file) => {
  //     const [filename] = file.basename.split('.');

  //     currentFilename = filename;
  //     return stream.pipe(buildEditor());
  //   })
  // );

  const html = src(['src/nodes/**/editor.html']).pipe(
    flatmap((stream, file) => {
      const [filename, ext] = file.basename.split('.');
      console.log(`file: ${filename} ${ext}`);

      if (ext === 'html') {
        const parts = file.path.match('[\\/]src[\\/]nodes[\\/]([^\\/]+)[\\/]editor.html');
        // const parts = file.path.match('/src/nodes/([^/]+)/editor.html');
        if (parts && parts.length > 1) {
          currentFilename = parts[1];
          return stream.pipe(buildForm());
        } else {
          console.log(`path does not match: ${file.path} ${JSON.stringify(parts)}`);
        }
      }

      throw Error(`Expecting html extension: ${file.basename}`);
    })
  );

  return merge([css, html])
    .pipe(concat('index.html'))
    .pipe(header(resourceFiles.join('')))
    .pipe(dest(editorFilePath + '/'));
};
exports.buildEditorFiles = buildEditorFiles;

const buildSourceFiles = () => {
  return tsProject.src().pipe(tsProject()).js.pipe(dest(editorFilePath));
};
exports.buildSourceFiles = buildSourceFiles;

// Clean generated files
const cleanAssetFiles = (done) => {
  del.sync(['dist/icons']);

  done();
};

const cleanSourceFiles = (done) => {
  del.sync(['dist/helpers', 'dist/homeAssistant', 'dist/nodes', 'dist/*.js']);

  done();
};

const cleanEditorFiles = (done) => {
  del.sync(['dist/index.html']);

  done();
};

const cleanAllFiles = parallel(cleanAssetFiles, cleanSourceFiles, cleanEditorFiles);
exports.cleanAllFiles = cleanAllFiles;

const copyIcons = () => {
  return src('src/icons/*').pipe(dest(`${editorFilePath}/icons`));
};

exports.copyAssetFiles = parallel(copyIcons);

exports.buildAll = parallel(buildEditorFiles, buildSourceFiles, copyIcons);
// exports.buildAll = parallel(['buildEditorFiles', 'buildSourceFiles']); //, 'copyAssetFiles']);
