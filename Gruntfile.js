'use strict';

module.exports = function(grunt) {

  // Configuration.
  grunt.initConfig({

    jshint: {
      files: {
        src: [
          'novel-compounds-bot.js',
          'build-corpus.js',
          'Gruntfile.js'
        ]
      },
      options: {
        eqeqeq:  true,
        forin:   true,
        undef:   true,
        unused:  true,
        strict:  true,
        eqnull:  true,
        node:    true,
        predef: [
          'Promise'
        ]
      }
    },

    jscs: {
      files: {
        src: [
          'novel-compounds-bot.js',
          'Gruntfile.js'
        ]
      },
      options: {
        requireCapitalizedConstructors: true,
        requireCurlyBraces:             true,
        requireDotNotation:             true,
        requireParenthesesAroundIIFE:   true,
        disallowEmptyBlocks:            true,
        disallowMixedSpacesAndTabs:     true,
        validateIndentation:            2,
        validateQuoteMarks:             '\''
      }
    },

    watch: {
      javascript: {
        files: ['**/*.js'],
        tasks: ['jshint', 'jscs']
      }
    }
  });

  // Plugins.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-notify');

  // Tasks.
  grunt.registerTask(
    'default',
    [
      'jshint',
      'jscs',
      'watch'
    ]
  );

};
