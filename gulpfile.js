const del = require('del');

const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

// General
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const flatmap = require('gulp-flatmap');
const lazypipe = require('lazypipe');
const merge = require('merge-stream');
const gulpMerge = require('gulp-merge');
const mergeJson = require('gulp-merge-json');
const wrap = require('gulp-wrap');
const { src, dest, series, task, watch, parallel } = require('gulp');
const through2 = require('through2');
// const fs = require('node:fs');
const fs = require('fs-extra');

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
const path = require('node:path/posix');
const sass = require('gulp-sass')(require('node-sass'));

// Markdown
// const marked = require('marked');
// Markdown-It
// const cheerio = require('gulp-cheerio');
// const markdownIt = require('gulp-markdownit');
// const markdownitContainer = require('markdown-it-container');
// const markdownitInlineComments = require('markdown-it-inline-comments');
// const md = require('markdown-it')();

// Constants
const docsUrl = 'https://epdoc.github.io/epdoc-node-red-hassio';
const destRootPath = 'dist';
const uiCssWrap = '<style><%= contents %></style>';
const uiJsWrap = '<script type="text/javascript"><%= contents %></script>';
const uiFormWrap = '<script type="text/html" data-template-name="<%= data.type %>"><%= data.contents %></script>';
const uiHelpWrap = '<script type="text/html" data-help-name="<%= data.type %>"><%= data.contents %></script>';
const tmpFilePath = 'tmpBuildFiles';
const resourcePath = 'resources';
const resourceFiles = [
  `<script src="${resourcePath}/select2.full.min.js?v=4.1.0-rc.0"></script>`
  // `<link rel="stylesheet" href="${resourcePath}/select2.min.css?v=4.1.0-rc.0">`,
  // `<script src="${resourcePath}/maximize-select2-height.min.js?v=1.0.4"></script>`
];

const nodeMap = {
  'fan-control': { doc: 'fan-control', type: 'fan-control' },
  'lower-case': { doc: 'lower-case', type: 'lower-case' },
  'location-history': { doc: 'location-history', type: 'location-history' },
  'ping-test': { doc: 'ping-test', type: 'ping-test' }
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
  ]);
// .pipe(wrap, uiCssWrap);
exports.buildSass = buildSass;

const buildCss = () => {
  return merge(src(['src/editor/css/**/*.scss', 'src/nodes/**/*.scss', '!_*.scss']).pipe(buildSass())).pipe(
    dest(tmpFilePath)
  );
};
exports.buildCss = buildCss;

const buildEditorFiles = () => {
  return src('src/nodes/**/editor.html')
    .pipe(
      through2.obj(async (file, enc, cb) => {
        if (file.isNull() || file.isDirectory()) {
          cb(null, file);
          return;
        }

        const directory = path.dirname(file.path);
        const type = path.basename(path.dirname(file.path));

        const editorJsPath = path.join(directory, 'editor.js');
        const editorHtmlPath = path.join(directory, 'editor.html');
        const helpHtmlPath = path.join(directory, 'help.html');
        const cssPath = path.join(tmpFilePath, 'common.css');

        const editorJsContent = fs.readFileSync(editorJsPath, 'utf8');
        const editorHtmlContent = fs.readFileSync(editorHtmlPath, 'utf8');
        const helpHtmlContent = fs.readFileSync(helpHtmlPath, 'utf8');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        const wrappedEditorJsContent = `<script type="text/javascript">\n${editorJsContent}\n</script>`;
        const wrappedEditorHtmlContent = `<script type="text/html" data-template-name="${type}">\n${editorHtmlContent}\n</script>`;
        const wrappedHelpHtmlContent = `<script type="text/html" data-help-name="${type}">\n${helpHtmlContent}\n</script>`;
        const wrappedCssContent = `<style>${cssContent}</style>`;

        const outputPath = path.join(destRootPath, 'src/nodes', type, `${type}.html`);
        const mergedContent = `${wrappedEditorHtmlContent}\n${wrappedEditorJsContent}\n${wrappedHelpHtmlContent}\n${wrappedCssContent}`;

        // Ensure the output folder exists
        fs.ensureDirSync(path.dirname(outputPath));

        fs.writeFileSync(outputPath, mergedContent);

        cb(null, file);
      })
    )
    .on('end', () => {
      console.log('Merge completed.');
    });
};
exports.buildEditorFiles = buildEditorFiles;

const buildSourceFiles = () => {
  return tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(dest(path.join(destRootPath, 'src')));
};
exports.buildSourceFiles = buildSourceFiles;

// Clean generated files
const cleanAssetFiles = (done) => {
  del.sync(['dist/src/**/*.svg']);
  done();
};

const cleanCss = (done) => {
  del.sync([tmpFilePath]);
  done();
};

const cleanSourceFiles = (done) => {
  const folders = ['helpers', 'homeAssistant', 'nodes', '*.js'].map((item) => {
    return path.resolve(destRootPath, 'src', item);
  });
  del.sync(folders);
  done();
};
exports.cleanSourceFiles = cleanSourceFiles;

const cleanAllFiles = parallel(cleanAssetFiles, cleanSourceFiles, cleanCss);
exports.cleanAllFiles = cleanAllFiles;

const copyIcons = () => {
  return src('src/**/*.svg').pipe(dest(`${destRootPath}/src`));
};
exports.copyIcons = copyIcons;

exports.copyAssetFiles = parallel(copyIcons);

exports.buildAll = parallel(series(buildCss, buildEditorFiles), buildSourceFiles, copyIcons, cleanCss);
// exports.buildAll = parallel(['buildEditorFiles', 'buildSourceFiles']); //, 'copyAssetFiles']);
