/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/
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

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
'use strict';

var PETRICHOR = (function(my) {

	my.FullscreenQuad = function(useDefaultShader) {
		// Create the mesh
		this.mesh = new my.Mesh();
		this.mesh.vertices = [-1.0, -1.0, 0.0, // DL
			1.0, -1.0, 0.0, // DR
			1.0, 1.0, 0.0, // UR
			-1.0, -1.0, 0.0, // DL
			1.0, 1.0, 0.0, // UR	
			-1.0, 1.0, 0.0
		]; // UL

		this.mesh.textureCoords = [0.0, 0.0, // DL
			1.0, 0.0, // DR
			1.0, 1.0, // UR
			0.0, 0.0, // DL
			1.0, 1.0, // UR
			0.0, 1.0
		]; // UL
		this.mesh.build();

		// Create the program for rendering this mesh
		this.program = new my.Program();
		if (useDefaultShader) {
			this.program.vertexSrc = 'precision highp float;\n' +
				'attribute vec3 aVertex;\n' +
				'attribute vec2 aTexCoord;\n' +
				'varying vec2 vTexCoord;\n' +
				'void main()\n' +
				'{\n' +
				'	vTexCoord = aTexCoord;\n' +
				'	gl_Position = vec4(aVertex, 1.0);\n' +
				'}';

			this.program.fragmentSrc = 'precision highp float;\n' +
				'uniform sampler2D uTexture;\n' +
				'varying vec2 vTexCoord;\n' +
				'void main()\n' +
				'{\n' +
				'	gl_FragColor = texture2D(uTexture, vTexCoord);\n' +
				'}';
			this.program.build();

			this.mesh.setAttributeName('vertex', 'aVertex');
			this.mesh.setAttributeName('uv', 'aTexCoord');
		}

		this.setShaders = function(vertexSrc, fragmentSrc) {
			this.program.vertexSrc = vertexSrc;
			this.program.fragmentSrc = fragmentSrc;
			this.program.build();
		};

		this.render = function(textures) {
			var gl = PETRICHOR.gl,
				i, tex;
			this.program.enable();
			if (textures) {
				for (i = 0; i < textures.length; i++) {
					tex = textures[i];
					this.program.setUniform1i(tex.sampler, i);
					gl.activeTexture(gl.TEXTURE0 + i);
					gl.bindTexture(gl.TEXTURE_2D, tex.id);
				}
			}
			this.mesh.render(this.program);
			this.program.disable();
		};

		return this;
	};


	my.createCube = function() {
		var cube = new my.Mesh();

		cube.vertices = [
			// Front face
			-1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0,
			// Back face
			1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0,
			1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0,
			// Top face
			-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
			// Bottom face
			-1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0,
			// Right face
			1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0,
			1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,
			// Left face
			-1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0
		];

		cube.normals = [
			// Front face
			0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
			0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
			// Back face
			0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
			0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
			// Top face
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
			// Bottom face
			0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
			0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
			// Right face
			1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
			1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
			// Left face
			-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0
		];

		cube.textureCoords = [
			// Front face
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
			// Back face
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
			// Top face
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
			// Bottom face
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
			// Right face
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
			// Left face
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 0.0, 1.0, 1.0
		];

		cube.build();

		return cube;
	};

	my.createUvSphere = function(radius, nbLatitudes, nbLongitudes) {
		var sphere,
			v0, v1, v2, v3, uv0, uv1, uv2, uv3,
			longitude, latitude,
			theta, phi, dtheta, dphi, theta2, phi2,
			sin = Math.sin,
			cos = Math.cos,
			pi = Math.PI,
			pi2 = pi / 2.0;



		function addVertex(vtx, uv) {
			var invRadius = 1.0 / radius;
			sphere.vertices.push(vtx[0]);
			sphere.vertices.push(vtx[1]);
			sphere.vertices.push(vtx[2]);

			sphere.normals.push(vtx[0] * invRadius);
			sphere.normals.push(vtx[1] * invRadius);
			sphere.normals.push(vtx[2] * invRadius);

			sphere.textureCoords.push(uv[0]);
			sphere.textureCoords.push(uv[1]);
		}

		sphere = new my.Mesh();
		sphere.vertices = [];
		sphere.normals = [];
		sphere.textureCoords = [];

		dtheta = -pi / (nbLatitudes - 1);
		dphi = 2.0 * pi / (nbLongitudes - 1);
		phi = 0.0;
		for (longitude = 0; longitude < nbLongitudes - 1; longitude++) {
			theta = pi2;
			phi2 = phi + dphi;
			for (latitude = 0; latitude < nbLatitudes - 1; latitude++) {
				theta2 = theta + dtheta;
				v0 = [
					radius * cos(theta) * cos(phi),
					radius * sin(theta),
					radius * cos(theta) * sin(phi)
				];
				uv0 = [
					(theta + pi2) / pi,
					phi / (2.0 * pi)
				];

				v1 = [
					radius * cos(theta2) * cos(phi),
					radius * sin(theta2),
					radius * cos(theta2) * sin(phi)
				];
				uv1 = [
					(theta2 + pi2) / pi,
					phi / (2.0 * pi)
				];

				v2 = [
					radius * cos(theta2) * cos(phi2),
					radius * sin(theta2),
					radius * cos(theta2) * sin(phi2)
				];
				uv2 = [
					(theta2 + pi2) / pi,
					phi2 / (2.0 * pi)
				];

				addVertex(v0, uv0);
				addVertex(v1, uv1);
				addVertex(v2, uv2);

				if ((latitude > 0) && (latitude < nbLatitudes - 1)) {
					v3 = [
						radius * cos(theta) * cos(phi2),
						radius * sin(theta),
						radius * cos(theta) * sin(phi2)
					];
					uv3 = [
						(theta + pi2) / pi,
						phi2 / (2.0 * pi)
					];

					addVertex(v0, uv0);
					addVertex(v2, uv2);
					addVertex(v3, uv3);
				}


				theta += dtheta;
			}
			phi += dphi;
		}

		sphere.build();

		return sphere;
	};

	my.renderText = function(textureSize, textLines, textHeight, fontStyle, fillColor, strikeColor) {
		var texture = new my.Texture2D(),
			canvas = null,
			context = null,
			i;

		canvas = document.createElement('canvas');
		canvas.id = 'tmpFontCanvas';
		canvas.style.border = 'none;';
		canvas.width = textureSize;
		canvas.height = textureSize;

		context = canvas.getContext('2d');

		context.clearRect(0, 0, textureSize, textureSize);

		context.fillStyle = fillColor;
		context.strokeStyle = strikeColor;
		context.font = fontStyle;

		for (i = 0; i < textLines.length; i++) {
			context.fillText(textLines[i], 0, textHeight * (i + 1));
			if (strikeColor) {
				context.strokeText(textLines[i], 0, textHeight * (i + 1));
			}
		}

		texture.image = canvas;
		texture.build();

		canvas = null;
		return texture;
	};

	return my;
}(PETRICHOR || {}));

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global mat4: false*/
'use strict';

var PETRICHOR = (function(my) {

  my.Texture2D = function (obj) {
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

    this.build = function () {
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

      if((this.filter.min == gl.LINEAR_MIPMAP_NEAREST) ||
        (this.filter.min ==  gl.LINEAR_MIPMAP_LINEAR)) {
        gl.generateMipmap(gl.TEXTURE_2D);
      }

      return this;
    };

    this.enable = function (unit) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, this.id);

      return this;
    };

    this.disable = function () {
      gl.bindTexture(gl.TEXTURE_2D, null);

      return this;
    };

    return this;
  };

  my.loadTexture2D = function(resource) {
    var tex = new my.Texture2D();
    tex.image = new Image();
    if(resource.hasOwnProperty('filter') && resource.filter) {
      tex.filter = resource.filter;
    }
    if(resource.hasOwnProperty('wrap') && resource.wrap) {
      tex.wrap = resource.wrap;
    }

    function loadHandler(tex) {
      try {
        tex.build();
        PETRICHOR.resources.loadCounter++;
      } catch(e) {
        console.log(e);
      }
    }

    tex.image.onload = function () {
      loadHandler(tex);
    };
    tex.image.src = resource.path;
    if(tex.image.complete) {
      loadHandler(tex);
    }
    resource.texture = tex;
  };

	return my;
}(PETRICHOR || {}));

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

var PETRICHOR = (function(my) {
  /**
   * The object holding a GLSL Program.
   */
  my.Program = function() {
    var gl = PETRICHOR.gl;

    this.id = null;
    this.vertexId = null;
    this.fragmentId = null;
    this.vertexSrc = '';
    this.fragmentSrc = '';
    this.uniforms = new my.Uniforms(this);
    this.attributes = new my.Attributes(this);

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
      if(!this.id) {
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
      mat3: (function () {return gl.uniformMatrix3fv;})(),
      mat4: (function () {return gl.uniformMatrix4fv;})(),
      int: (function () {return gl.uniform1i;})(),
    };

    this.setUniformMatrix3fv = function (name, val) {
      var gl = PETRICHOR.gl,
        uni = this.uniforms.get(name);
      if((!uni) || (uni === -1)) {
        return this;
      }
      gl.uniformMatrix3fv(uni, false, val);
    };

    this.setUniformMatrix4fv = function (name, val) {
      var gl = PETRICHOR.gl,
        uni = this.uniforms.get(name);
      if((!uni) || (uni === -1)) {
        return this;
      }
      gl.uniformMatrix4fv(uni, false, val);
    };

    this.setUniform1i = function (name, val) {
      var gl = PETRICHOR.gl,
        uni = this.uniforms.get(name);
      if((!uni) || (uni === -1)) {
        return this;
      }
      gl.uniform1i(uni, val);
    };

    this.setUniform2fv = function (name, val) {
      var gl = PETRICHOR.gl,
        uni = this.uniforms.get(name);
      if((!uni) || (uni === -1)) {
        return this;
      }
      gl.uniform2fv(uni, val);
    };

    this.setUniform3fv = function (name, val) {
      var gl = PETRICHOR.gl,
        uni = this.uniforms.get(name);
      if((!uni) || (uni === -1)) {
        return this;
      }
      gl.uniform3fv(uni, val);
    };

    this.setUniform1f = function (name, val) {
      var gl = PETRICHOR.gl,
        uni = this.uniforms.get(name);
      if((!uni) || (uni === -1)) {
        return this;
      }
      gl.uniform1f(uni, val);
    };

    return this;
  };

  my.Uniforms = function (program) {
    this.program = program;
    this.bindings = {};

    this.get = function (name) {
      var gl = PETRICHOR.gl;
      if((!this.bindings[name]) || (!this.bindings.hasOwnProperty(name)) || (this.bindings[name] === -1)) {
        program.enable();
        this.bindings[name] = gl.getUniformLocation(this.program.id, name);
      }
      return this.bindings[name];
    };

    return this;
  };

  my.Attributes = function (program) {
    this.program = program;
    this.bindings = {};

    this.get = function (name) {
      var gl = PETRICHOR.gl;
      if((!this.bindings[name]) || (!this.bindings.hasOwnProperty(name)) ||
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
  my.loadProgram = function(resource) {
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

    resource.program = new my.Program();

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

  return my;
}(PETRICHOR || {}));

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global console: false*/
'use strict';

var PETRICHOR = (function(my) {
    /**
     * Loads a music from a resource object describing it.
     * @param  {object} resource The object describing the music. It must have
     * the following properties:
     * 	- path: the path to the music file.
     * The object is then modified to contain an Audio object named 'audio'
     * representing the loaded music.
     */
    my.loadMusic = function(resource) {
        var oggSupport = false, mp3Support = false;
        console.log('Loading music...');
        if (!resource) {
            return;
        }
        if ((!resource.ogg) && (!resource.mp3)) {
            console.log('No path for music.');
            return;
        }
        resource.audio = new Audio();
        mp3Support = !!(resource.audio.canPlayType && 
                        resource.audio.canPlayType('audio/mpeg;')
                            .replace(/no/, ''));
        oggSupport = !!(resource.audio.canPlayType && 
                        resource.audio.canPlayType('audio/ogg; codecs="vorbis"')
                            .replace(/no/, ''));
        if(resource.hasOwnProperty('mp3') && mp3Support) {
            resource.audio.src = resource.mp3;
            console.log('Music loaded: MP3 format.');
        } else if(resource.hasOwnProperty('ogg') && oggSupport) {
            resource.audio.src = resource.ogg;
            console.log('Music loaded: OGG format.');
        } else {
            console.log('Music not loaded: unsupported format.')
        }
        
        PETRICHOR.resources.loadCounter++;
    };

    /**
     * Starts the playing of the music.
     */
    my.playMusic = function() {
        PETRICHOR.resources.music.audio.play();
    };

    return my;
}(PETRICHOR || {}));

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
'use strict';

var PETRICHOR = (function(my) {

  /**
   * The object holding a mesh.
   */
  my.Mesh = function(isDynamic, obj) {
    this.vertices = null;
    this.normals = null;
    this.textureCoords = null;
    this.indices = null;
    this.transform = new my.Transform();
    this.textures = [];

    this.isDynamic = isDynamic || false;

    this.vertexBuffer = null;
    this.normalBuffer = null;
    this.textureCoordsBuffer = null;
    this.indexBuffer = null;

    this.attributeNames = {};

    if (obj) {
      this.set(obj);
    }

    /**
     * Sets mesh data.
     * @param {object} obj Contains the geometry of the mesh.
     */
    this.set = function(obj) {
      if (obj.hasOwnProperty('vertices')) {
        this.vertices = new Float32Array(obj.vertices);
      }
      if (obj.hasOwnProperty('normals')) {
        this.normals = new Float32Array(obj.normals);
      }
      if (obj.hasOwnProperty('uv')) {
        this.textureCoords = new Float32Array(obj.uv);
      }
      if (obj.hasOwnProperty('indices')) {
        this.indices = new Uint16Array(obj.indices);
      }

      return this;
    };

    /**
     * Builds the buffers for OpenGL rendering.
     */
    this.build = function() {
      var gl = PETRICHOR.gl;

      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices),
        this.isDynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      this.vertexBuffer.itemSize = 3;
      this.vertexBuffer.itemCount = this.vertices.length / 3;

      if (this.normals) {
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals),
          this.isDynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        this.normalBuffer.itemSize = 3;
        this.normalBuffer.itemCount = this.normals.length / 3;
      }

      if (this.textureCoords) {
        this.textureCoordsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoords),
          this.isDynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        this.textureCoordsBuffer.itemSize = 2;
        this.textureCoordsBuffer.itemCount = this.textureCoords.length / 2;
      }

      if (this.indices) {
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices),
          this.isDynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        this.indexBuffer.itemSize = 1;
        this.indexBuffer.itemCount = this.indices.length;
      }

      return this;
    };

    /**
     * Renders this Mesh.
     * @param  {PETRICHOR.PROGRAM.Program} program    The GLSL program with
     * which this Mesh must be rendered.
     * the connection between this Mesh and program.
     */
    this.render = function(program, camera) {
      var gl = PETRICHOR.gl,
        vertexAttrib = -1,
        normalAttrib = -1,
        textureCoordAttrib = -1,
        i, tex;

      program.enable();
      if(camera) {
        camera.upload(program, this.transform);  
      }      
      try {
      for(i = 0; i < this.textures.length; i++) {
        tex = this.textures[i];
        tex.texture.enable(tex.unit);
        program.setUniform1i(tex.sampler, tex.unit);
      }
    } catch(e){console.log(e);}

      if(this.attributeNames.hasOwnProperty('vertex')) {
        vertexAttrib = program.attributes.get(this.attributeNames.vertex);
      }
      if(this.attributeNames.hasOwnProperty('normal')) {
        normalAttrib = program.attributes.get(this.attributeNames.normal);
      }
      if(this.attributeNames.hasOwnProperty('uv')) {
        textureCoordAttrib = program.attributes.get(this.attributeNames.uv);
      }

      gl.enableVertexAttribArray(vertexAttrib);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(vertexAttrib, this.vertexBuffer.itemSize,
        gl.FLOAT, false, 0, 0);

      if (this.attributeNames.hasOwnProperty('normal')) {
        gl.enableVertexAttribArray(normalAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(normalAttrib, this.normalBuffer.itemSize,
          gl.FLOAT, false, 0, 0);
      }

      if (this.attributeNames.hasOwnProperty('uv')) {
        gl.enableVertexAttribArray(textureCoordAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordsBuffer);
        gl.vertexAttribPointer(textureCoordAttrib,
          this.textureCoordsBuffer.itemSize,
          gl.FLOAT, false, 0, 0);
      }

      if (this.indices) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexBuffer.itemCount,
          gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
      }

      return this;
    };

    this.setAttributeName = function(attrib, name) {
      this.attributeNames[attrib] = name;
      return this;
    };

    this.setTexture = function (unit, tex, sampler) {
      var obj = {
        unit: unit,
        texture: tex,
        sampler: sampler
      };
      this.textures.push(obj);
      
      return this;
    };

    return this;
  };

  my.Transform = function () {
    this.translation = vec3.create();
    this.rotation = vec3.create();
    this.scale = vec3.fromValues(1.0, 1.0, 1.0);
    this.transformMatrix = mat4.create();
    this.dirty = false;

    this.setTranslation = function (x, y, z) {
      this.translation[0] = x;
      this.translation[1] = y;
      this.translation[2] = z;
      this.dirty = true;
      return this;
    };

    this.setRotation = function (x, y, z) {
      this.rotation[0] = x;
      this.rotation[1] = y;
      this.rotation[2] = z;
      this.dirty = true;
      return this;
    };

    this.setScale = function (x, y, z) {
      this.scale[0] = x;
      this.scale[1] = y;
      this.scale[2] = z;
      this.dirty = true;
      return this;
    };

    this.getTransformationMatrix = function () {
      var translationMat = mat4.create(),
          rotationMat = mat4.create(),
          scaleMat = mat4.create();

      if(!this.dirty) {
        return this.transformMatrix;
      }

      mat4.identity(rotationMat);
      mat4.rotateX(rotationMat, rotationMat, this.rotation[0]);
      mat4.rotateY(rotationMat, rotationMat, this.rotation[1]);
      mat4.rotateZ(rotationMat, rotationMat, this.rotation[2]);

      mat4.translate(translationMat, translationMat, this.translation);

      mat4.scale(scaleMat, scaleMat, this.scale);

      mat4.identity(this.transformMatrix);
      mat4.multiply(this.transformMatrix, this.transformMatrix, scaleMat);
      mat4.multiply(this.transformMatrix, this.transformMatrix, translationMat);
      mat4.multiply(this.transformMatrix, this.transformMatrix, rotationMat);
      

      this.dirty = false;

      return this.transformMatrix;
    };

    return this;
  };

  /**
   * Loads a Mesh from a resource object describing it.
   * @param  {object} resource The object describing the Mesh. It must have
   * the following properties:
   * 	- path: the path to a JSON file containing the mesh.
   * The object is then modified to contain a Mesh object named 'mesh'
   * representing the loaded Mesh.
   */
  my.loadMesh = function(resource) {
    var xhrMesh = new XMLHttpRequest();

    function handleLoadedMesh(resource, request) {
      var obj = JSON.parse(request.responseText);
      resource.mesh = new my.Mesh();
      resource.mesh.set(obj);
      resource.mesh.isDynamic = obj.isDynamic;
      resource.mesh.build();
      PETRICHOR.resources.loadCounter++;
    }

    xhrMesh.open('GET', resource.path);
    xhrMesh.overrideMimeType('text/plain');
    xhrMesh.onreadystatechange = (function(resource, req) {
      return function() {
        if (req.readyState == 4) {
          handleLoadedMesh(resource, req);
        }
      };
    })(resource, xhrMesh);

    xhrMesh.send();
  };

  return my;
}(PETRICHOR || {}));

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
'use strict';

var PETRICHOR = (function(my) {

	my.Light = function () {
		this.color = vec3.fromValues(1.0, 1.0, 1.0);
		this.position = vec3.fromValues(0.0, 0.0, 0.0);
		this.radius = 2.0;
		this.power = 1.0;

		this.uniforms = {
			color: '',
			position: '',
			radius: '',
			power: ''
		};

		this.setUniforms = function(uniforms) {
			if(uniforms.hasOwnProperty('color') && uniforms.color) {
				this.uniforms.color = uniforms.color;
			}

			if(uniforms.hasOwnProperty('position') && uniforms.position) {
				this.uniforms.position = uniforms.position;
			}

			if(uniforms.hasOwnProperty('radius') && uniforms.radius) {
				this.uniforms.radius = uniforms.radius;
			}

			if(uniforms.hasOwnProperty('power') && uniforms.power) {
				this.uniforms.power = uniforms.power;
			}

			return this;
		};

		this.uploadParams = function (program) {
			if(this.uniforms.color) {
				program.setUniform3fv(this.uniforms.color, this.color);
			}

			if(this.uniforms.position) {
				program.setUniform3fv(this.uniforms.position, this.position);
			}

			if(this.uniforms.radius) {
				program.setUniform1f(this.uniforms.radius, this.radius);
			}

			if(this.uniforms.power) {
				program.setUniform1f(this.uniforms.power, this.power);
			}
		};

		return this;
	};

  return my;
}(PETRICHOR || {}));

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global mat4: false*/
'use strict';

var PETRICHOR = (function(my) {

	my.Fbo = function (width, height) {
		this.frameBuffer = null;
		this.colorBuffer = null;
		this.depthBuffer = null;
		this.width = width;
		this.height = height;

		this.build = function (depthAsTexture) {
			var gl = PETRICHOR.gl;			

			// creation of fbo
			this.frameBuffer = gl.createFramebuffer();
  		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
  		if(gl.getError() != gl.NO_ERROR) {
  			alert('Error in gl.bindFramebuffer');
  		}

  		// creation of render target
  		this.colorBuffer = gl.createTexture();
  		gl.bindTexture(gl.TEXTURE_2D, this.colorBuffer);
  		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.width, this.height, 0,
		                  gl.RGB, gl.UNSIGNED_BYTE, null);
		  if(gl.getError() != gl.NO_ERROR) {
  			alert('Error in creating the fbo color buffer');
  		}
		  
		  // creation of depth buffer
      if(depthAsTexture) {
        // creation as a texture
        var ext = my.getExtension('WEBGL_depth_texture');
        if(ext == null) {
          alert('WEBGL_depth_texture extension required.\n' +
                'Please switch to a modern browser.');
          return;
        }
        this.depthBuffer = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthBuffer);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, 
                      this.width, this.height, 0, gl.DEPTH_COMPONENT, 
                      gl.UNSIGNED_SHORT, null);

        if(gl.getError() != gl.NO_ERROR) {
          alert('Error in creating the fbo depth buffer');
        }
      } else {
    		this.depthBuffer = gl.createRenderbuffer();
    		gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
    		if(gl.getError() != gl.NO_ERROR) {
    			alert('Error in gl.bindRenderbuffer');
    		}
    		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
    														this.width, this.height);
      }
  		if(gl.getError() != gl.NO_ERROR) {
  			alert('Error in gl.renderbufferStorage');
  		}

		  // attach render target
 			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
  															gl.TEXTURE_2D, this.colorBuffer, 0); 		
  		if(gl.getError() != gl.NO_ERROR) {
  			alert('Error attaching color buffer');
  		}	

 			// attach depth buffer
      if(depthAsTexture) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                                gl.TEXTURE_2D, this.depthBuffer, 0);
      } else {
    		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
    																gl.RENDERBUFFER, this.depthBuffer);
      }
      if(gl.getError() != gl.NO_ERROR) {
        alert('Error attaching depth buffer');
      }


  		if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
  			alert('Error in FBO creation');
  		}
    
  		gl.bindTexture(gl.TEXTURE_2D, null);
		  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		};

		this.begin = function () {
			var gl = PETRICHOR.gl;
  		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
  		if(gl.getError() != gl.NO_ERROR) {
  			alert('Error in Fbo.begin');
  		}
		};

		this.end = function () {
			var gl = PETRICHOR.gl;
  		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  		if(gl.getError() != gl.NO_ERROR) {
  			alert('Error in Fbo.end');
  		}
		};

		return this;
	};

	return my;
}(PETRICHOR || {}));

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global console: false*/
'use strict';

var PETRICHOR = (function(my) {

	my.Effect = function(name, initCallback, updateCallback, loop, startTime, endTime) {
		this.name = name;
		this.initCallback = initCallback;
		this.updateCallback = updateCallback;
		this.startTime = startTime;
		this.endTime = endTime;
		this.loop = loop;

		this.init = function() {
			console.log('Initializing effect "' + this.name + '"...');
			this.initCallback();
		};

		this.update = function(time) {
			this.updateCallback(time);
		};

		return this;
	};

	my.effects = [];

	my.addEffect = function(fx) {
		my.effects.push(fx);
	};
	my.time = 0;

	my.initEffects = function() {
		var i = 0,
			fx = null;

		for (i = 0; i < my.effects.length; i++) {
			fx = my.effects[i];
			fx.init();
		}
		my.time = new Date().getTime();
	};

	my.playEffects = function() {
		var i = 0,
			time = new Date().getTime() - my.time,
			fx = null;

		for (i = 0; i < my.effects.length; i++) {
			fx = my.effects[i];
			if (fx.loop || ((fx.startTime <= time) && (fx.endTime >= time))) {
				fx.update(time);
			}
		}
	};

	my.start = function() {
		my.initEffects();
		my.play();
	};

	my.play = function() {
		if (document.getElementById('chkFps').checked) {
			PETRICHOR.showFps("fps");
		} else {
			document.getElementById('fps').innerHTML = '';
		}

		window.requestAnimFrame(my.play);

		my.playEffects();
	};


	return my;
}(PETRICHOR || {}));

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global mat4: false*/
'use strict';

var PETRICHOR = (function(my) {

	my.Camera = function() {
		this.matrixUniforms = {};

		/**
		 * The vertical field of view.
		 * Default value : 45.0 degrees
		 * @type {Number}
		 */
		this.fovy = 45.0;
		/**
		 * The near clipping plane distance from the Camera.
		 * Default value : 0.1
		 * @type {Number}
		 */
		this.near = 0.1;
		/**
		 * The far clipping plane distance from the Camera.
		 * Default value : 100.0
		 * @type {Number}
		 */
		this.far = 2.0;
		/**
		 * The screen ratio. Should be adjusted according to actual canvas reslution.
		 * Default value : 4.0/3.0
		 * @type {[type]}
		 */
		this.ratio = 4.0 / 3.0;
		/**
		 * The position of the Camera.
		 * Default value : [0, 0, 3]
		 * @type {Array}
		 */
		this.position = [0, 0, 3];
		/**
		 * The target of the Camera.
		 * Default value : the center of the scene.
		 * @type {Array}
		 */
		this.center = [0, 0, 0];
		/**
		 * The up vector, giving the orientation of the Camera.
		 * Default value : up
		 * @type {Array}
		 */
		this.up = [0, 1, 0];

		/**
		 * The projection matrix, which will be used in rendering.
		 * @type {mat4}
		 */
		this.projectionMatrix = mat4.create();

		/**
		 * The view matrix, which will be used in rendering.
		 * @type {mat4}
		 */
		this.viewMatrix = mat4.create();

		/**
		 * Updates projectionMatrix with the current values of fovy, ratio, near and far.
		 */
		this.setPerspective = function() {
			mat4.perspective(this.projectionMatrix, this.fovy, this.ratio, this.near,
				this.far);

			return this;
		};

		/**
		 * Sets an orthographic projection matrix in projectionMatrix, using near and far.
		 * @param {Number} left   The left clipping plane.
		 * @param {Number} right  The right clipping plane.
		 * @param {Number} bottom The bottom clipping plane.
		 * @param {Number} top    The top clipping plane.
		 */
		this.setOrthographic = function(left, right, bottom, top) {
			mat4.ortho(this.projectionMatrix, left, right, bottom, top, this.near,
				this.far);
			return this;
		};

		/**
		 * Updates viewMatrix with current values of position, center, and up.
		 */
		this.lookAt = function() {
			mat4.lookAt(this.viewMatrix, this.position, this.center, this.up);
			return this;
		};

		this.setUniform = function (matrixName, uniformName) {
      this.matrixUniforms[matrixName] = uniformName;
			return this;
		};

		this.upload = function (program, transform) {
			var modelMatrix = transform.getTransformationMatrix(),
					mvpMatrix = mat4.create(),
					normalMatrix = mat3.create();

			// MVP
			mat4.multiply(mvpMatrix, this.projectionMatrix, this.viewMatrix);
			mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);

			// normal matrix
			mat3.normalFromMat4(normalMatrix, modelMatrix);

			// upload
			program.setUniformMatrix3fv(this.matrixUniforms.normalMatrix, normalMatrix);
      program.setUniformMatrix4fv(this.matrixUniforms.modelMatrix, modelMatrix);
      program.setUniformMatrix4fv(this.matrixUniforms.projectionMatrix, this.projectionMatrix);
      program.setUniformMatrix4fv(this.matrixUniforms.viewMatrix, this.viewMatrix);
      program.setUniformMatrix4fv(this.matrixUniforms.mvpMatrix, mvpMatrix);

      program.setUniform1f(this.matrixUniforms.near, this.near);
      program.setUniform1f(this.matrixUniforms.far, this.far);
		};

		return this;
	};



	return my;
}(PETRICHOR || {}));
