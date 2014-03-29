module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/*.js',
        dest: '<%= pkg.name %>.min.js'
      }
    },
    concat: {
        dist: {
          src: ['src/*.js'],
          dest: '<%= pkg.name %>.js'
        }
    },
    jsdoc : {
        dist : {
            src: ['src/*.js', 'test/*.js'], 
            options: {
                destination: 'doc'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.loadNpmTasks('grunt-jsdoc');

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'concat', 'jsdoc']);

};
