/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global window: false*/
/*global console: false*/
'use strict';

var PETRICHOR = PETRICHOR || {};
/**
 * The object holding a GLSL Program.
 */
PETRICHOR.Program = function() {
  var gl = PETRICHOR.gl;

  this.id = null;
  this.vertexId = null;
  this.fragmentId = null;
  this.vertexSrc = '';
  this.fragmentSrc = '';
  this.uniforms = new PETRICHOR.Uniforms(this);
  this.attributes = new PETRICHOR.Attributes(this);

  /**
   * PRIVATE utility for compiling a shader.
   * @param {string} shaderType Either 'vertex' or 'fragment'.
   * @param {string} source     The source of the specified shader to compile.
   */
  function compileShader(shaderType, source) {
    var gl = PETRICHOR.gl,
      id = 0,
      log = '';
    if (!source) return;

    if (shaderType === 'vertex') {
      id = gl.createShader(gl.VERTEX_SHADER);
    } else if (shaderType === 'fragment') {
      id = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
      return 0;
    }

    gl.shaderSource(id, source);
    gl.compileShader(id);

    if (!gl.getShaderParameter(id, gl.COMPILE_STATUS)) {
      log = gl.getShaderInfoLog(id);
      if (log) {
        window.alert('Error in the ' + shaderType + ' shader.\n' +
          'Check console to see details.');
        console.log(log);
      }
      return null;
    }

    return id;
  }

  /**
   * Sets the source of vertex and fragment shaders.
   * @param {string} vertexSource   The vertex shader source.
   * @param {string} fragmentSource The fragment shader source.
   */
  this.setSource = function(vertexSource, fragmentSource) {
    this.vertexSrc = vertexSource;
    this.fragmentSrc = fragmentSource;
  };


  /**
   * Compiles and links the shaders to build this Program.
   * @return {Program} Returns this Program's instance.
   */
  this.build = function() {
    var gl = PETRICHOR.gl;

    this.id = gl.createProgram();
    this.vertexId = compileShader('vertex', this.vertexSrc);
    this.fragmentId = compileShader('fragment', this.fragmentSrc);

    gl.attachShader(this.id, this.vertexId);
    gl.attachShader(this.id, this.fragmentId);
    gl.linkProgram(this.id);

    if (!gl.getProgramParameter(this.id, gl.LINK_STATUS)) {
      window.alert('Could not initialise shader');
    }
    return this;
  };

  /**
   * Sets OpenGL to use this Program for rendering.
   * @return {Program} Returns this Program's instance.
   */
  this.enable = function() {
    var gl = PETRICHOR.gl;
    if (!this.id) {
      this.build();
    }
    gl.useProgram(this.id);
    return this;
  };

  /**
   * Disables the use of GLSL programs.
   * @return {Program} Returns this Program's instance.
   */
  this.disable = function() {
    var gl = PETRICHOR.gl;
    gl.useProgram(null);
    return this;
  };

  this.setU = {
    mat3: (function() {
      return gl.uniformMatrix3fv;
    })(),
    mat4: (function() {
      return gl.uniformMatrix4fv;
    })(),
    int: (function() {
      return gl.uniform1i;
    })(),
  };

  this.setUniformMatrix3fv = function(name, val) {
    var gl = PETRICHOR.gl,
      uni = this.uniforms.get(name);
    if ((!uni) || (uni === -1)) {
      return this;
    }
    gl.uniformMatrix3fv(uni, false, val);
  };

  this.setUniformMatrix4fv = function(name, val) {
    var gl = PETRICHOR.gl,
      uni = this.uniforms.get(name);
    if ((!uni) || (uni === -1)) {
      return this;
    }
    gl.uniformMatrix4fv(uni, false, val);
  };

  this.setUniform1i = function(name, val) {
    var gl = PETRICHOR.gl,
      uni = this.uniforms.get(name);
    if ((!uni) || (uni === -1)) {
      return this;
    }
    gl.uniform1i(uni, val);
  };

  this.setUniform2fv = function(name, val) {
    var gl = PETRICHOR.gl,
      uni = this.uniforms.get(name);
    if ((!uni) || (uni === -1)) {
      return this;
    }
    gl.uniform2fv(uni, val);
  };

  this.setUniform3fv = function(name, val) {
    var gl = PETRICHOR.gl,
      uni = this.uniforms.get(name);
    if ((!uni) || (uni === -1)) {
      return this;
    }
    gl.uniform3fv(uni, val);
  };

  this.setUniform1f = function(name, val) {
    var gl = PETRICHOR.gl,
      uni = this.uniforms.get(name);
    if ((!uni) || (uni === -1)) {
      return this;
    }
    gl.uniform1f(uni, val);
  };

  return this;
};

PETRICHOR.Uniforms = function(program) {
  this.program = program;
  this.bindings = {};

  this.get = function(name) {
    var gl = PETRICHOR.gl;
    if ((!this.bindings[name]) || (!this.bindings.hasOwnProperty(name)) || (this.bindings[name] === -1)) {
      program.enable();
      this.bindings[name] = gl.getUniformLocation(this.program.id, name);
    }
    return this.bindings[name];
  };

  return this;
};

PETRICHOR.Attributes = function(program) {
  this.program = program;
  this.bindings = {};

  this.get = function(name) {
    var gl = PETRICHOR.gl;
    if ((!this.bindings[name]) || (!this.bindings.hasOwnProperty(name)) ||
      (this.bindings[name] === -1)) {
      program.enable();
      this.bindings[name] = gl.getAttribLocation(this.program.id, name);
    }
    return this.bindings[name];
  };

  return this;
};

/**
 * Loads a program from a resource object describing it.
 * @param  {object} resource The object describing the program. It must have
 * the following properties:
 * 	- vertexPath: the path to a text file containing the vertex shader.
 * 	- fragmentPath: the path to a text file containing the fragment shader.
 * The object is then modified to contain a Program object named 'program'
 * representing the loaded GLSL program.
 */
PETRICHOR.loadProgram = function(resource) {
  var vertPath = resource.vertexPath,
    fragPath = resource.fragmentPath,
    xhrVertex = new XMLHttpRequest(),
    xhrFragment = new XMLHttpRequest();

  // Once vertex and fragment shaders are loaded, builds the program and
  // increments the loaded resources counter.
  function finalizeProgramLoad(res) {
    console.log('finalizeProgramLoad');
    if ((!res.program.fragmentSrc) || (!res.program.vertexSrc)) {
      setTimeout(function() {
        finalizeProgramLoad(res);
      }, 50);
      return;
    }

    res.program.build();
    PETRICHOR.resources.loadCounter++;
  }

  // Once a shader is loaded, sets the source in the corresponding program.
  function handleLoadedShader(res, request, shaderType) {
    switch (shaderType) {
      case 'fragment':
        {
          res.program.fragmentSrc = request.responseText;
          break;
        }
      case 'vertex':
        {
          res.program.vertexSrc = request.responseText;
          break;
        }
    }
  }

  resource.program = new PETRICHOR.Program();

  xhrVertex.open('GET', vertPath);
  xhrVertex.overrideMimeType('text/plain');
  xhrVertex.onreadystatechange = (function(resource, req) {
    return function() {
      if (req.readyState == 4) {
        handleLoadedShader(resource, req, 'vertex');
      }
    };
  })(resource, xhrVertex);

  xhrFragment.open('GET', fragPath);
  xhrFragment.overrideMimeType('text/plain');
  xhrFragment.onreadystatechange = (function(resource, req) {
    return function() {
      if (req.readyState == 4) {
        handleLoadedShader(resource, req, 'fragment');
      }
    };
  })(resource, xhrFragment);

  xhrVertex.send();
  xhrFragment.send();

  finalizeProgramLoad(resource);
};
