//S1:
module.exports = function(grunt) {
  'use strict';

  //S2    
  grunt.initConfig({
    //S3:Open the package.json
    pkg: grunt.file.readJSON('package.json'),
    //S4:The Concate Task
    concat: {
      build: {
        options: {
          separator: '\n\r',
          banner: "/*\n" +
            "Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>\n" +
            "This work is free. You can redistribute it and/or modify it under the\n" +
            "terms of the Do What The Fuck You Want To Public License, Version 2,\n" +
            "as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.\n" +
            "*/\n"
        },
        // select the files to concatenate
        src: 'src/*.js',
        // the resulting JS file
        dest: 'build/petrichor.js'
      },

      withlibs: {
        src: ['src/*.js', 'lib/*.js'],
        dest: 'build/petrichor-with-libs.js'
      }

    },

    //S5:Task for Minification
    uglify: {
      options: {
        //  banner for inserting at the top of the result
        banner: "/*\n" +
          "Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>\n" +
          "This work is free. You can redistribute it and/or modify it under the\n" +
          "terms of the Do What The Fuck You Want To Public License, Version 2,\n" +
          "as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.\n" +
          "*/\n"
          // banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      
      build: {
        src: ['build/petrichor.js'],
        dest: 'build/petrichor-min.js'
      },

      withlibs: {
        src: 'build/petrichor-with-libs.js',
        dest: 'build/petrichor-with-libs-min.js'
      }
    },

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify']); 
};
