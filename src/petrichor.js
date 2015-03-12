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

window.clientWidth = function() {
  return window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
};
window.clientHeight = function() {
  return window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
};

var PETRICHOR = PETRICHOR || {};

//  ######     ###    ##    ## ##     ##    ###     ######     #### ##    ## #### ########
// ##    ##   ## ##   ###   ## ##     ##   ## ##   ##    ##     ##  ###   ##  ##     ##
// ##        ##   ##  ####  ## ##     ##  ##   ##  ##           ##  ####  ##  ##     ##
// ##       ##     ## ## ## ## ##     ## ##     ##  ######      ##  ## ## ##  ##     ##
// ##       ######### ##  ####  ##   ##  #########       ##     ##  ##  ####  ##     ##
// ##    ## ##     ## ##   ###   ## ##   ##     ## ##    ##     ##  ##   ###  ##     ##
//  ######  ##     ## ##    ##    ###    ##     ##  ######     #### ##    ## ####    ##

// The resolution of the demo, by default 640x480
PETRICHOR.width = 640;
PETRICHOR.height = 480;
// The canvas on which draw the demo
PETRICHOR.mainCanvas = null;
// The OpenGL context
PETRICHOR.gl = null;
/**
 * Initializes the system and creates the canvas with the specified options.
 */
PETRICHOR.init = function(options) {

  function getOptimumCanvasSize() {
    var ratio = PETRICHOR.width / PETRICHOR.height,
      maxWidth = window.clientWidth,
      maxHeight = Math.round(window.clientWidth / ratio),
      result = {
        width: maxWidth,
        height: maxHeight
      };

    result.height = result.width / ratio;

    if (result.height > maxHeight) {
      result.height = maxHeight;
      result.width = Math.round(result.height * ratio);
    }

    return result;
  }

  function resizeCanvas() {
    var optimumDimensions = getOptimumCanvasSize();

    PETRICHOR.mainCanvas.style.width = optimumDimensions.width + 'px';
    PETRICHOR.mainCanvas.style.height = optimumDimensions.height + 'px';

    PETRICHOR.mainCanvas.style.position = 'absolute';
    PETRICHOR.mainCanvas.style.top = (Math.round((window.clientHeight -
      optimumDimensions.height) / 2) - 1) + 'px';
    PETRICHOR.mainCanvas.style.left = (Math.round((window.clientWidth -
      optimumDimensions.width) / 2) - 1) + 'px';
  }

  function createCanvas(options) {
    console.log('Creating canvas...');
    PETRICHOR.width = options.width;
    PETRICHOR.height = options.height;

    PETRICHOR.mainCanvas = document.createElement('canvas');
    PETRICHOR.mainCanvas.id = 'mainCanvas';
    PETRICHOR.mainCanvas.style.border = 'none;';
    PETRICHOR.mainCanvas.width = PETRICHOR.width;
    PETRICHOR.mainCanvas.height = PETRICHOR.height;

    resizeCanvas();
    window.onresize = resizeCanvas;

    document.body.appendChild(PETRICHOR.mainCanvas);
    console.log('Canvas created.');
  }

  function createGlContext() {
    console.log('Creating WebGL context...');
    try {
      PETRICHOR.gl = PETRICHOR.mainCanvas.getContext('webgl');
      PETRICHOR.gl.viewportWidth = PETRICHOR.mainCanvas.width;
      PETRICHOR.gl.viewportHeight = PETRICHOR.mainCanvas.height;
    } catch (e) {}
    if (!PETRICHOR.gl) {
      try {
        PETRICHOR.gl = PETRICHOR.mainCanvas.getContext('experimental-webgl');
        PETRICHOR.gl.viewportWidth = PETRICHOR.mainCanvas.width;
        PETRICHOR.gl.viewportHeight = PETRICHOR.mainCanvas.height;
      } catch (e) {}
    }
    if (!PETRICHOR.gl) {
      window.alert('Could not initialize WebGL, sorry :-(');
    } else {
      console.log('WebGL context created.');
    }
  }

  createCanvas(options);
  createGlContext();
};


// ########  ########  ######   #######  ##     ## ########   ######  ########  ######     ##        #######     ###    ########  #### ##    ##  ######
// ##     ## ##       ##    ## ##     ## ##     ## ##     ## ##    ## ##       ##    ##    ##       ##     ##   ## ##   ##     ##  ##  ###   ## ##    ##
// ##     ## ##       ##       ##     ## ##     ## ##     ## ##       ##       ##          ##       ##     ##  ##   ##  ##     ##  ##  ####  ## ##
// ########  ######    ######  ##     ## ##     ## ########  ##       ######    ######     ##       ##     ## ##     ## ##     ##  ##  ## ## ## ##   ####
// ##   ##   ##             ## ##     ## ##     ## ##   ##   ##       ##             ##    ##       ##     ## ######### ##     ##  ##  ##  #### ##    ##
// ##    ##  ##       ##    ## ##     ## ##     ## ##    ##  ##    ## ##       ##    ##    ##       ##     ## ##     ## ##     ##  ##  ##   ### ##    ##
// ##     ## ########  ######   #######   #######  ##     ##  ######  ########  ######     ########  #######  ##     ## ########  #### ##    ##  ######
// Access to meshes, glsl programs, textures etc.
PETRICHOR.resources = {
  textures: {},
  programs: {},
  meshes: {},
  music: null,
  loadCounter: 0
};

/**
 * Sets the music path and gives it to the resource container.
 */
PETRICHOR.setMusic = function(ogg, mp3) {
  PETRICHOR.resources.music = {
    ogg: ogg,
    mp3: mp3
  };
};

/**
 * Adds a mesh to the resource container.
 */
PETRICHOR.addMesh = function(name, meshPath) {
  PETRICHOR.resources.meshes[name] = {
    path: meshPath
  };
};

/**
 * Adds a program to the resource container.
 */
PETRICHOR.addProgram = function(name, vertPath, fragPath) {
  PETRICHOR.resources.programs[name] = {
    vertexPath: vertPath,
    fragmentPath: fragPath
  };
};

PETRICHOR.addTexture = function(name, texturePath, filtering, wrapping) {
  PETRICHOR.resources.textures[name] = {
    path: texturePath,
    filter: filtering,
    wrap: wrapping
  };
};

PETRICHOR.addResources = function(resources) {
  var i, res;

  for (i = 0; i < resources.length; i++) {
    res = resources[i];
    switch (res.type) {
      case 'music':
        {
          PETRICHOR.setMusic(res.ogg, res.mp3);
          break;
        }
      case 'mesh':
        {
          PETRICHOR.addMesh(res.name, res.path);
          break;
        }
      case 'program':
        {
          PETRICHOR.addProgram(res.name, res.vertexPath, res.fragmentPath);
          break;
        }
      case 'texture':
        {
          PETRICHOR.addTexture(res.name, res.path, res.filter, res.wrap);
          break;
        }
    }
  }
};

/**
 * Loads all resources stored in the resource container, by delegating to the
 * appropriate modules.
 */
PETRICHOR.loadResources = function() {
  var name, res;

  console.log('Loading meshes...');
  for (name in PETRICHOR.resources.meshes) {
    if (!PETRICHOR.resources.meshes.hasOwnProperty(name)) continue;
    res = PETRICHOR.resources.meshes[name];
    PETRICHOR.loadMesh(res);
  }
  console.log('Loading programs...');
  for (name in PETRICHOR.resources.programs) {
    if (!PETRICHOR.resources.programs.hasOwnProperty(name)) continue;
    res = PETRICHOR.resources.programs[name];
    PETRICHOR.loadProgram(res);
  }
  console.log('Loading textures...');
  for (name in PETRICHOR.resources.textures) {
    if (!PETRICHOR.resources.textures.hasOwnProperty(name)) continue;
    res = PETRICHOR.resources.textures[name];
    PETRICHOR.loadTexture2D(res);
  }
  console.log('Loading music...');
  PETRICHOR.loadMusic(PETRICHOR.resources.music);
};

function countResources() {
  var key, count = 0;
  for (key in PETRICHOR.resources.meshes) {
    if (PETRICHOR.resources.meshes.hasOwnProperty(key)) {
      count++;
    }
  }
  for (key in PETRICHOR.resources.programs) {
    if (PETRICHOR.resources.programs.hasOwnProperty(key)) {
      count++;
    }
  }
  for (key in PETRICHOR.resources.textures) {
    if (PETRICHOR.resources.textures.hasOwnProperty(key)) {
      count++;
    }
  }
  if (PETRICHOR.resources.music) {
    count++;
  }
  return count;
}

PETRICHOR.isFinishedLoading = function() {
  return PETRICHOR.resources.loadCounter == countResources();
};


// ######## ########   ######      ######   #######  ##     ## ##    ## ########
// ##       ##     ## ##    ##    ##    ## ##     ## ##     ## ###   ##    ##
// ##       ##     ## ##          ##       ##     ## ##     ## ####  ##    ##
// ######   ########   ######     ##       ##     ## ##     ## ## ## ##    ##
// ##       ##              ##    ##       ##     ## ##     ## ##  ####    ##
// ##       ##        ##    ##    ##    ## ##     ## ##     ## ##   ###    ##
// ##       ##         ######      ######   #######   #######  ##    ##    ##
PETRICHOR.fps = {
  frameTimes: [],
  currentFrame: 0,
  frameStart: new Date().getTime(),
  frameEnd: new Date().getTime()
};

PETRICHOR.showFps = function(elemId) {
  var fps = 0.0,
    elapsed = 0.0,
    i, total = 0.0;

  PETRICHOR.fps.frameEnd = new Date().getTime();
  elapsed = PETRICHOR.fps.frameEnd - PETRICHOR.fps.frameStart;
  PETRICHOR.fps.frameStart = PETRICHOR.fps.frameEnd;

  for (i = 0; i < PETRICHOR.fps.frameTimes.length; i++) {
    total = total + PETRICHOR.fps.frameTimes[i];
  }

  if (total >= 1000) {
    fps = (PETRICHOR.fps.frameTimes.length * 1000.0 / total).toFixed(2);
    document.getElementById(elemId).innerHTML = fps + ' fps';
    PETRICHOR.fps.currentFrame = 0;
    PETRICHOR.fps.frameTimes.length = 0;
  }

  PETRICHOR.fps.frameTimes[PETRICHOR.fps.currentFrame++] = elapsed;

};

// ######## ##     ## ######## ######## ##    ##  ######  ####  #######  ##    ##  ######
// ##        ##   ##     ##    ##       ###   ## ##    ##  ##  ##     ## ###   ## ##    ##
// ##         ## ##      ##    ##       ####  ## ##        ##  ##     ## ####  ## ##
// ######      ###       ##    ######   ## ## ##  ######   ##  ##     ## ## ## ##  ######
// ##         ## ##      ##    ##       ##  ####       ##  ##  ##     ## ##  ####       ##
// ##        ##   ##     ##    ##       ##   ### ##    ##  ##  ##     ## ##   ### ##    ##
// ######## ##     ##    ##    ######## ##    ##  ######  ####  #######  ##    ##  ######

PETRICHOR.extensions = {};

PETRICHOR.getExtension = function(extensionName) {
  var prefixes = ['', 'MOZ_', 'WEBKIT_'],
    i, ext = null,
    gl = PETRICHOR.gl;
  if (PETRICHOR.extensions.hasOwnProperty(extensionName)) {
    return PETRICHOR.extensions[extensionName];
  }
  for (i = 0; i < prefixes.length; i++) {
    ext = gl.getExtension(prefixes[i] + extensionName);
    if (ext !== null) break;
  }
  PETRICHOR.extensions[extensionName] = ext;
  return ext;
};
