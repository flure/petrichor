/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/
/*jshint globalstrict: true*/
/*global window: false*/
/*global document: false*/
/*global console: false*/
'use strict';

/*******************************************************************************
********************************************************************************
  UTILITIES
********************************************************************************
*******************************************************************************/
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( /* function FrameRequestCallback */ callback,
      /* DOMElement Element */
      element) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

window.getMaxWidth = function() {
  return window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
};
window.getMaxHeight = function() {
  return window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
};

/*******************************************************************************
********************************************************************************
  PETRICHOR MODULE
********************************************************************************
*******************************************************************************/
var PETRICHOR = (function(my) {
  // The resolution of the demo, by default 640x480
  my.width = 640;
  my.height = 480;
  // The OpenGL object
  my.gl = null;
  // Access to meshes, glsl programs, textures etc.
  my.resources = {
    textures: {},
    programs: {},
    meshes: {},
    music: null,
    loadCounter: 0
  };
  // The canvas on which draw the demo
  my.mainCanvas = null;

  my.fps = {
    frameTimes: [],
    currentFrame: 0,
    frameStart: new Date().getTime(),
    frameEnd: new Date().getTime()
  };

  my.extensions = {};

  /*****************************************************************************
    CANVAS INITIALIZATION
  *****************************************************************************/
  function getOptimumCanvasSize() {
    var ratio = my.width / my.height,
      maxWidth = window.getMaxWidth(),
      maxHeight = Math.round(window.getMaxWidth() / ratio),
      result = {
        width: maxWidth,
        height: maxHeight
      };

    result.height = result.width / ratio;

    if(result.height > maxHeight) {
      result.height = maxHeight;
      result.width = Math.round(result.height * ratio);
    }

    return result;
  }

  /**
   * Initializes the system and creates the canvas with the specified options.
   */
  my.init = function(options) {
    /**
     * Returns an object containing the optimum dimensions for the canvas,
     * depending on the current window dimensions.
     */


    /**
     * Sets the canvas dimensions to the optimum.
     */
    function resizeCanvas() {
      var optimumDimensions = getOptimumCanvasSize();

      my.mainCanvas.style.width = optimumDimensions.width + 'px';
      my.mainCanvas.style.height = optimumDimensions.height + 'px';

      my.mainCanvas.style.position = 'absolute';
      my.mainCanvas.style.top = (Math.round((window.getMaxHeight() -
        optimumDimensions.height) / 2) - 1) + 'px';
      my.mainCanvas.style.left = (Math.round((window.getMaxWidth() -
        optimumDimensions.width) / 2) - 1) + 'px';
    }

    /**
     * Creates the canvas.
     */
    function createCanvas(options) {
      console.log('Creating canvas...');
      my.width = options.width;
      my.height = options.height;

      my.mainCanvas = document.createElement('canvas');
      my.mainCanvas.id = 'mainCanvas';
      my.mainCanvas.style.border = 'none;';
      my.mainCanvas.width = my.width;
      my.mainCanvas.height = my.height;

      resizeCanvas();
      window.onresize = resizeCanvas;

      document.body.appendChild(my.mainCanvas);
      console.log('Canvas created.');
    }

    /**
     * Creates the WebGL context.
     */
    function createGlContext() {
      console.log('Creating WebGL context...');
      try {
        my.gl = my.mainCanvas.getContext('webgl');
        my.gl.viewportWidth = my.mainCanvas.width;
        my.gl.viewportHeight = my.mainCanvas.height;
      } catch (e) {}
      if (!my.gl) {
        try {
          my.gl = my.mainCanvas.getContext('experimental-webgl');
          my.gl.viewportWidth = my.mainCanvas.width;
          my.gl.viewportHeight = my.mainCanvas.height;
        } catch (e) {}
      }
      if (!my.gl) {
        window.alert('Could not initialize WebGL, sorry :-(');
      } else {
        console.log('WebGL context created.');
      }
    }

    createCanvas(options);
    createGlContext();
  };

  /**
   * Sets the music path and gives it to the resource container.
   */
  my.setMusic = function(ogg, mp3) {
    my.resources.music = {
      ogg: ogg,
      mp3: mp3
    };
  };

  /**
   * Adds a mesh to the resource container.
   */
  my.addMesh = function(name, meshPath) {
    my.resources.meshes[name] = {
      path: meshPath
    };
  };

  /**
   * Adds a program to the resource container.
   */
  my.addProgram = function(name, vertPath, fragPath) {
    my.resources.programs[name] = {
      vertexPath: vertPath,
      fragmentPath: fragPath
    };
  };

  my.addTexture = function(name, texturePath, filtering, wrapping) {
    my.resources.textures[name] = {
      path: texturePath,
      filter: filtering,
      wrap: wrapping
    };
  };

  my.addResources = function(resources) {
    var i, res;

    for (i = 0; i < resources.length; i++) {
      res = resources[i];
      switch (res.type) {
        case 'music':
          {
            my.setMusic(res.ogg, res.mp3);
            break;
          }
        case 'mesh':
          {
            my.addMesh(res.name, res.path);
            break;
          }
        case 'program':
          {
            my.addProgram(res.name, res.vertexPath, res.fragmentPath);
            break;
          }
        case 'texture':
          {
            my.addTexture(res.name, res.path, res.filter, res.wrap);
            break;
          }
      }
    }
  };

  /**
   * Loads all resources stored in the resource container, by delegating to the
   * appropriate modules.
   */
  my.loadResources = function () {
    var name, res;

    console.log('Loading meshes...');
    for (name in my.resources.meshes) {
      if (!my.resources.meshes.hasOwnProperty(name)) continue;
      res = my.resources.meshes[name];
      my.loadMesh(res);
    }
    console.log('Loading programs...');
    for (name in my.resources.programs) {
      if (!my.resources.programs.hasOwnProperty(name)) continue;
      res = my.resources.programs[name];
      my.loadProgram(res);
    }
    console.log('Loading textures...');
    for (name in my.resources.textures) {
      if (!my.resources.textures.hasOwnProperty(name)) continue;
      res = my.resources.textures[name];
      my.loadTexture2D(res);
    }
    console.log('Loading music...');
    my.loadMusic(my.resources.music);
  };

  function countResources() {
    var key, count = 0;
    for (key in my.resources.meshes) {
      if (my.resources.meshes.hasOwnProperty(key)) {
        count++;
      }
    }
    for (key in my.resources.programs) {
      if (my.resources.programs.hasOwnProperty(key)) {
        count++;
      }
    }
    for (key in my.resources.textures) {
      if (my.resources.textures.hasOwnProperty(key)) {
        count++;
      }
    }
    if (my.resources.music) {
      count++;
    }
    return count;
  }

  my.isFinishedLoading = function() {
    return my.resources.loadCounter == countResources();
  };

  my.showFps = function (elemId) {
    var fps = 0.0, elapsed = 0.0, i, total = 0.0;

    my.fps.frameEnd = new Date().getTime();
    elapsed = my.fps.frameEnd - my.fps.frameStart;
    my.fps.frameStart = my.fps.frameEnd;

    for(i = 0; i < my.fps.frameTimes.length; i++) {
      total = total + my.fps.frameTimes[i];
    }

    if(total >= 1000) {
      fps = (my.fps.frameTimes.length * 1000.0 / total).toFixed(2);
      document.getElementById(elemId).innerHTML = "" + fps + " fps";
      my.fps.currentFrame = 0;
      my.fps.frameTimes.length = 0;
    }

    my.fps.frameTimes[my.fps.currentFrame++] = elapsed;

  };

  my.getExtension = function (extensionName) {
    var prefixes = ['', 'MOZ_', 'WEBKIT_'], i, ext = null;
    if(my.extensions.hasOwnProperty(extensionName)) {
      return my.extensions[extensionName];
    }
    for(i = 0; i < prefixes.length; i++) {
      ext = gl.getExtension(prefixes[i] + extensionName);
      if(ext != null) break;
    }
    my.extensions[extensionName] = ext;
    return ext;
  };

  return my;
}(PETRICHOR || {}));
