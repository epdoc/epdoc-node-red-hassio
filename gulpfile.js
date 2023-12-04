const del = require('del');

const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

// General
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const flatmap = require('gulp-flatmap');
const lazypipe = require('lazypipe');
const merge = require('merge-stream');
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
  ])
  .pipe(wrap, uiCssWrap);
exports.buildSass = buildSass;

// Shrink js and wrap it
// const buildJs = lazypipe().pipe(terser).pipe(wrap, uiJsWrap);
// exports.buildJs = buildJs;

// const buildForm = lazypipe()
//   .pipe(gulpHtmlmin, {
//     collapseWhitespace: true,
//     minifyCSS: true
//   })
//   .pipe(() => wrap(uiFormWrap, { type: nodeMap[type].type }, { variable: 'data' }));
// exports.buildForm = buildForm;

// const buildEditor = lazypipe()
//   .pipe(gulpHtmlmin, {
//     collapseWhitespace: true,
//     minifyCSS: true
//   })
//   .pipe(() =>
//     wrap(
//       uiFormWrap,
//       {},
//       // { type: editorMap[type] },
//       { variable: 'data' }
//     )
//   );
// exports.buildEditor = buildEditor;

// const buildHtml = lazypipe().pipe();

// const gulp = require('gulp');

const buildEditorFiles3 = () => {
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

        const editorJsContent = fs.readFileSync(editorJsPath, 'utf8');
        const editorHtmlContent = fs.readFileSync(editorHtmlPath, 'utf8');
        const helpHtmlContent = fs.readFileSync(helpHtmlPath, 'utf8');

        const wrappedEditorJsContent = `<script type="text/javascript">\n${editorJsContent}\n</script>`;
        const wrappedEditorHtmlContent = `<script type="text/html" data-template-name="${type}">\n${editorHtmlContent}\n</script>`;
        const wrappedHelpHtmlContent = `<script type="text/html" data-help-name="${type}">\n${helpHtmlContent}\n</script>`;

        const outputPath = path.join('dist/nodes', type, `${type}.html`);
        const mergedContent = `${wrappedEditorHtmlContent}\n${wrappedEditorJsContent}\n${wrappedHelpHtmlContent}`;

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
exports.buildEditorFiles3 = buildEditorFiles3;

const buildEditorFiles = () => {
  const css = src(['src/editor/css/**/*.scss', 'src/nodes/**/*.scss', '!_*.scss']).pipe(buildSass());
  css.pipe(rename('index.css')).pipe(dest(destRootPath));

  if (false) {
    let cache;
    const js = rollupStream({
      input: 'src/editor.ts',
      cache,
      output: {
        dir: destRootPath,
        format: 'iife'
      },
      plugins: [
        rollupTypescript({
          tsconfig: 'tsconfig.editor.json'
        })
      ],
      external: []
    })
      .on('bundle', (bundle) => {
        cache = bundle;
      })
      .pipe(source('editor.ts'))
      .pipe(buffer())
      .pipe(buildJs());
  }

  if (false) {
    const editorsHtml = src(['src/editor/editors/*.html']).pipe(
      flatmap((stream, file) => {
        const [filename] = file.basename.split('.');

        currentFilename = filename;
        return stream.pipe(buildEditor());
      })
    );
  }

  return src(['src/nodes/**/editor.html']).pipe(
    flatmap((stream, file) => {
      const [filename, ext] = file.basename.split('.');

      if (ext === 'html') {
        const parts = file.path.match('[\\/]src[\\/]nodes[\\/]([^\\/]+)[\\/]editor.html');
        // const parts = file.path.match('/src/nodes/([^/]+)/editor.html');
        if (parts && parts.length > 1) {
          currentFilename = parts[1];
          const form = src([`${file.base}/${currentFilename}/editor.html`]).pipe(buildForm());
          const help = src([`${file.base}/${currentFilename}/help.html`]).pipe(buildHelp());
          const js = src([`${file.base}/${currentFilename}/editor.js`]).pipe(buildJs());
          const destPath = path.resolve(destRootPath, 'nodes', currentFilename);
          const destFilename = `${currentFilename}.html`;
          console.log(`input: ${file.path},\noutput ${destPath}`);
          // help.pipe(rename('help.html')).pipe(dest(destPath));
          return merge(js, form, help, css).pipe(rename(destFilename)).pipe(dest(destPath));
          // return (
          //   stream
          //     .pipe(buildForm())
          //     .pipe(concat(help))
          //     .pipe(merge(css))
          //     // .pipe(header(resourceFiles.join('')))
          //     .pipe(rename(destFilename))
          //     .pipe(dest(destPath))
          // );
        } else {
          console.log(`path does not match: ${file.path} ${JSON.stringify(parts)}`);
        }
      }

      throw Error(`Expecting html extension: ${file.basename}`);
    })
  );
  // done();
  // return (
  //   merge([css, html])
  //     // .pipe(concat('index.html'))
  //     .pipe(header(resourceFiles.join('')))
  //     .pipe(dest(editorFilePath + '/'))
  // );
};
exports.buildEditorFiles = buildEditorFiles;

const buildSourceFiles = () => {
  return tsProject.src().pipe(tsProject()).js.pipe(dest(destRootPath));
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
  return src('src/icons/*').pipe(dest(`${destRootPath}/icons`));
};

exports.copyAssetFiles = parallel(copyIcons);

exports.buildAll = parallel(buildEditorFiles, buildSourceFiles, copyIcons);
// exports.buildAll = parallel(['buildEditorFiles', 'buildSourceFiles']); //, 'copyAssetFiles']);
