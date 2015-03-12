/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global mat4: false*/
'use strict';

var PETRICHOR = PETRICHOR || {};

PETRICHOR.Texture2D = function(obj) {
  var gl = PETRICHOR.gl;
  this.image = null;
  this.filter = {
    min: gl.LINEAR_MIPMAP_LINEAR,
    mag: gl.LINEAR
  };
  this.wrap = {
    s: gl.CLAMP_TO_EDGE,
    t: gl.CLAMP_TO_EDGE
  };

  this.id = null;

  this.build = function() {
    var gl = PETRICHOR.gl;

    this.id = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.id);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0,
      gl.RGBA, gl.RGBA,
      gl.UNSIGNED_BYTE, this.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.filter.min);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.filter.mag);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrap.s);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrap.t);

    if ((this.filter.min == gl.LINEAR_MIPMAP_NEAREST) ||
      (this.filter.min == gl.LINEAR_MIPMAP_LINEAR)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    return this;
  };

  this.enable = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.id);

    return this;
  };

  this.disable = function() {
    gl.bindTexture(gl.TEXTURE_2D, null);

    return this;
  };

  return this;
};

PETRICHOR.loadTexture2D = function(resource) {
  var tex = new PETRICHOR.Texture2D();
  tex.image = new Image();
  if (resource.hasOwnProperty('filter') && resource.filter) {
    tex.filter = resource.filter;
  }
  if (resource.hasOwnProperty('wrap') && resource.wrap) {
    tex.wrap = resource.wrap;
  }

  function loadHandler(tex) {
    try {
      tex.build();
      PETRICHOR.resources.loadCounter++;
    } catch (e) {
      console.log(e);
    }
  }

  tex.image.onload = function() {
    loadHandler(tex);
  };
  tex.image.src = resource.path;
  if (tex.image.complete) {
    loadHandler(tex);
  }
  resource.texture = tex;
};
