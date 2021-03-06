'use strict';

var path = require('path');
var defaultsDeep = require('lodash.defaultsdeep');
var postcss = require('gulp-postcss');
var reporter = require('postcss-reporter');
var stylelint = require('stylelint');
var notifier = require('node-notifier');
var tap = require('gulp-tap');
var stripSync = require('strip-css-singleline-comments/sync');

module.exports = function (gulp, gulpConfig) {

  gulpConfig = gulpConfig || { basePath: '.' };

  // Merge default config with gulp config.
  var defaultConfig = {
    stylelint: {
      src: path.join('some', 'source', 'folder', '**', '*.css'),
      rules: {
        // Basics
        'indentation': [2, 2],
        'value-no-vendor-prefix': [2],
        'rule-trailing-semicolon': [2, 'always'],

        // Avoid accidental overrides
        'rule-no-shorthand-property-overrides': 2,

        // Math
        'number-leading-zero': [2, 'always'],
        'number-zero-length-no-unit': 2,

        // Consistent whitespace
        'no-eol-whitespace': 2,
        'function-calc-no-unspaced-operator': 2,
        'function-comma-space-before': [2, 'never'],
        'function-comma-space-after': [2, 'always'],
        'function-space-after': [2, 'always'],
        'value-list-comma-space-before': [2, 'never'],
        'value-list-comma-space-after': [2, 'always-single-line'],
        'selector-combinator-space-before': [2, 'never'],
        'selector-combinator-space-after': [2, 'always'],
        'media-feature-colon-space-before': [2, 'never'],
        'media-feature-colon-space-after': [2, 'always'],
        'media-feature-range-operator-space-before': [2, 'never'],
        'media-feature-range-operator-space-after': [2, 'always'],
        'media-query-list-comma-space-before': [2, 'never'],
        'media-query-list-comma-space-after': [2, 'always'],
        'media-query-parentheses-space-inside': [2, 'never'],

        // Consistent new lines
        'no-missing-eof-newline': 2,
        'block-closing-brace-newline-after': [2, 'always'],
        'nesting-block-opening-brace-newline-before': [2, 'always'],
        'rule-nested-empty-line-before': [2, 'always', {
          except: ['first-nested'],
          ignore: ['after-comment']
        }],

        // @todo These rules seem valuable but currently do not work in stable version:
        // 'function-linear-gradient-no-nonstandard-direction': 2, // -> Undefined rule function-linear-gradient-no-nonstandard-direction
        // 'declaration-colon-space-after': [2, 'always-single-line'], // -> Invalid option value "always-single-line" for rule "declaration-colon-space-after"
        // 'selector-combinator-space-before': [2, 'always'], // does not work with multiline nested selectors

        // @todo: Contribution required to make this really useful: https://github.com/stylelint/stylelint/issues/393
        // 'rule-properties-order': [2, ["array", "of", "unprefixed", "property", "names"]],
      },
      notify: {
        title: 'Wunderkraut',
        message: 'Stylelint found some errors in your code.'
      }
    }
  };

  var config = defaultsDeep(gulpConfig, defaultConfig).stylelint;

  var processors = [
    stylelint({
      rules: config.rules
    }),
    reporter({
      clearMessages: true
    })
  ];

  // Create stream to catch postcss errors.
  var postcssStream = postcss(processors);

  postcssStream.on('error', function (error) {
    // Log error to console.
    console.error(error.message);

    // Display error notification.
    var message = error.message
      .replace(/^\/[^ ]+\//, '')
      .replace(/\^/, '')
      .replace(/\s/, ' ')
      .trim();

    notifier.notify({
      title: config.notify.title + ' - Stylelint PostCSS Error',
      message: message,
      icon: gulpConfig.notify.errorIcon,
      sound: false
    });

    this.emit('end');
  });

  gulp.task('stylelint-watch', ['stylelint'], function () {
    gulp.watch(path.join(gulpConfig.basePath, config.src), function (event) {
      if (['changed', 'added'].indexOf(event.type) !== -1) {
        return gulp.src(event.path)
          .pipe(tap(function(file) {
            // Strips all single line comments.
            file.contents = new Buffer(stripSync(file.contents));
          }))
          .pipe(postcssStream);
      }
    });
  });

  gulp.task('stylelint', function () {
    return gulp.src(path.join(gulpConfig.basePath, config.src))
      .pipe(tap(function(file) {
        // Strips all single line comments.
        file.contents = new Buffer(stripSync(file.contents));
      }))
      .pipe(postcssStream);
  });
};
