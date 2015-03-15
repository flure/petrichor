/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global mat4: false*/
/*global mat3: false*/
/*global PETRICHOR: false*/

'use strict';

var PETRICHOR = PETRICHOR || {};

PETRICHOR.Camera = function() {
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

	this.setUniform = function(matrixName, uniformName) {
		this.matrixUniforms[matrixName] = uniformName;
		return this;
	};

	this.upload = function(program, transform) {
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

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global console: false*/
'use strict';

var PETRICHOR = PETRICHOR || {};

/**
 * An effect is a pair of init and update functions, along with a set of
 * timing parameters. init is called once at the beginning of the demo,
 * and update is called each frame between startTime and endTime, or never
 * stops if loop == True
 * @param {String} name           The name of the effect
 * @param {function} initCallback   The init function
 * @param {function} updateCallback The update function
 * @param {Boolean} loop           If True then endTime is ignored
 * @param {Integer} startTime      The beginning of the effect in ms
 * @param {Integer} endTime        The end of the effect in ms
 */
PETRICHOR.Effect = function(name, initCallback, updateCallback, loop, startTime, endTime) {
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

/**
 * The list of effects for this demo.
 */
PETRICHOR.effects = [];

/**
 * Add an effect fx to the list.
 */
PETRICHOR.addEffect = function(fx) {
	PETRICHOR.effects.push(fx);
};
PETRICHOR.time = 0;

/**
 * Initializes all the effects by calling their init() function.
 */
PETRICHOR.initEffects = function() {
	var i = 0,
		fx = null;

	for (i = 0; i < PETRICHOR.effects.length; i++) {
		fx = PETRICHOR.effects[i];
		fx.init();
	}
	PETRICHOR.time = new Date().getTime();
};

/**
 * Plays the effects, taking into account the current time and the timing info
 * of each effect. Ordering the effects when adding them is important for
 * effects which timings overlap.
 */
PETRICHOR.playEffects = function(currentTime) {
	var i = 0,
		time = currentTime || (new Date().getTime() - PETRICHOR.time),
		fx = null;

	for (i = 0; i < PETRICHOR.effects.length; i++) {
		fx = PETRICHOR.effects[i];
		if ((fx.startTime <= time) && (fx.loop || (fx.endTime >= time))) {
			fx.update(time);
		}
	}
};

/**
 * Stats the demo by initializing all the effects and then playing them.
 */
PETRICHOR.start = function() {
	PETRICHOR.initEffects();
	(function play () {
		PETRICHOR.play();
		window.requestAnimFrame(play, document);
	})();
};

/**
 * Plays all the effects in order.
 */
PETRICHOR.play = function(currentTime) {
	if (document.getElementById('chkFps').checked) {
		PETRICHOR.showFps('fps');
	} else {
		document.getElementById('fps').innerHTML = '';
	}

	PETRICHOR.playEffects(currentTime);
};

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

/**
 * The object used to manage Framebuffer Objects (FBO).
 * @param {Integer} width  The pixel width of the FBO
 * @param {Integer} height The pixel height of the FBO
 */
PETRICHOR.Fbo = function(width, height) {
  this.frameBuffer = null;
  this.colorBuffer = null;
  this.depthBuffer = null;
  this.width = width;
  this.height = height;

  /**
   * Builds this FBO.
   * @param  {Boolean} depthAsTexture Tells if we want to use the depth buffer
   *                                  as a texture.
   */
  this.build = function(depthAsTexture) {
    var gl = PETRICHOR.gl;

    // creation of fbo
    this.frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    if (gl.getError() != gl.NO_ERROR) {
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
    if (gl.getError() != gl.NO_ERROR) {
      alert('Error in creating the fbo color buffer');
    }

    // creation of depth buffer
    if (depthAsTexture) {
      // creation as a texture
      var ext = PETRICHOR.getExtension('WEBGL_depth_texture');
      if (ext == null) {
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

      if (gl.getError() != gl.NO_ERROR) {
        alert('Error in creating the fbo depth buffer');
      }
    } else {
      this.depthBuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
      if (gl.getError() != gl.NO_ERROR) {
        alert('Error in gl.bindRenderbuffer');
      }
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
        this.width, this.height);
    }
    if (gl.getError() != gl.NO_ERROR) {
      alert('Error in gl.renderbufferStorage');
    }

    // attach render target
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, this.colorBuffer, 0);
    if (gl.getError() != gl.NO_ERROR) {
      alert('Error attaching color buffer');
    }

    // attach depth buffer
    if (depthAsTexture) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D, this.depthBuffer, 0);
    } else {
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER, this.depthBuffer);
    }
    if (gl.getError() != gl.NO_ERROR) {
      alert('Error attaching depth buffer');
    }


    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
      alert('Error in FBO creation');
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  /**
   * Begins rendering to this FBO.
   */
  this.begin = function() {
    var gl = PETRICHOR.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    if (gl.getError() != gl.NO_ERROR) {
      alert('Error in Fbo.begin');
    }
  };

  /**
   * Ends rendering to this FBO, switches back to the default rendering target.
   */
  this.end = function() {
    var gl = PETRICHOR.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (gl.getError() != gl.NO_ERROR) {
      alert('Error in Fbo.end');
    }
  };

  return this;
};

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
'use strict';

var PETRICHOR = PETRICHOR || {};

PETRICHOR.Light = function() {
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
		if (uniforms.hasOwnProperty('color') && uniforms.color) {
			this.uniforms.color = uniforms.color;
		}

		if (uniforms.hasOwnProperty('position') && uniforms.position) {
			this.uniforms.position = uniforms.position;
		}

		if (uniforms.hasOwnProperty('radius') && uniforms.radius) {
			this.uniforms.radius = uniforms.radius;
		}

		if (uniforms.hasOwnProperty('power') && uniforms.power) {
			this.uniforms.power = uniforms.power;
		}

		return this;
	};

	this.uploadParams = function(program) {
		if (this.uniforms.color) {
			program.setUniform3fv(this.uniforms.color, this.color);
		}

		if (this.uniforms.position) {
			program.setUniform3fv(this.uniforms.position, this.position);
		}

		if (this.uniforms.radius) {
			program.setUniform1f(this.uniforms.radius, this.radius);
		}

		if (this.uniforms.power) {
			program.setUniform1f(this.uniforms.power, this.power);
		}
	};

	return this;
};

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
'use strict';

var PETRICHOR = PETRICHOR || {};

/**
 * The object holding a mesh.
 */
PETRICHOR.Mesh = function(isDynamic, obj) {
  this.vertices = null;
  this.normals = null;
  this.textureCoords = null;
  this.indices = null;
  this.transform = new PETRICHOR.Transform();
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
    if (camera) {
      camera.upload(program, this.transform);
    }
    try {
      for (i = 0; i < this.textures.length; i++) {
        tex = this.textures[i];
        tex.texture.enable(tex.unit);
        program.setUniform1i(tex.sampler, tex.unit);
      }
    } catch (e) {
      console.log(e);
    }

    if (this.attributeNames.hasOwnProperty('vertex')) {
      vertexAttrib = program.attributes.get(this.attributeNames.vertex);
    }
    if (this.attributeNames.hasOwnProperty('normal')) {
      normalAttrib = program.attributes.get(this.attributeNames.normal);
    }
    if (this.attributeNames.hasOwnProperty('uv')) {
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

  this.setTexture = function(unit, tex, sampler) {
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

PETRICHOR.Transform = function() {
  this.translation = vec3.create();
  this.rotation = vec3.create();
  this.scale = vec3.fromValues(1.0, 1.0, 1.0);
  this.transformMatrix = mat4.create();
  this.dirty = false;

  this.setTranslation = function(x, y, z) {
    this.translation[0] = x;
    this.translation[1] = y;
    this.translation[2] = z;
    this.dirty = true;
    return this;
  };

  this.setRotation = function(x, y, z) {
    this.rotation[0] = x;
    this.rotation[1] = y;
    this.rotation[2] = z;
    this.dirty = true;
    return this;
  };

  this.setScale = function(x, y, z) {
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;
    this.dirty = true;
    return this;
  };

  this.getTransformationMatrix = function() {
    var translationMat = mat4.create(),
      rotationMat = mat4.create(),
      scaleMat = mat4.create();

    if (!this.dirty) {
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
PETRICHOR.loadMesh = function(resource) {
  var xhrMesh = new XMLHttpRequest();

  function handleLoadedMesh(resource, request) {
    var obj = JSON.parse(request.responseText);
    resource.mesh = new PETRICHOR.Mesh();
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

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global console: false*/
'use strict';

var PETRICHOR = PETRICHOR || {};

PETRICHOR.music = null;
/**
 * Loads a music from a resource object describing it.
 * @param  {object} resource The object describing the music. It must have
 * the following properties:
 * 	- path: the path to the music file.
 * The object is then modified to contain an Audio object named 'audio'
 * representing the loaded music.
 */
PETRICHOR.loadMusic = function(resource) {
    var oggSupport = false,
        mp3Support = false;
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
    if (resource.hasOwnProperty('mp3') && mp3Support) {
        resource.audio.src = resource.mp3;
        console.log('Music loaded: MP3 format.');
    } else if (resource.hasOwnProperty('ogg') && oggSupport) {
        resource.audio.src = resource.ogg;
        console.log('Music loaded: OGG format.');
    } else {
        console.log('Music not loaded: unsupported format.')
    }

    PETRICHOR.music = PETRICHOR.resources.music.audio;

    PETRICHOR.resources.loadCounter++;
};


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

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
/*global JSRocket: false*/
/*global console: false*/
/*global document: false*/
'use strict';

var PETRICHOR = PETRICHOR || {};

PETRICHOR.SyncManager = function(rocketFile, bpm, rowsPerBeat, editMode, port) {
	this.BPM = bpm;
	this.ROWS_PER_BEAT = rowsPerBeat;
	this.ROW_RATE = this.BPM / 60 * this.ROWS_PER_BEAT;
	this.rocketFile = rocketFile;
	this.editMode = editMode;
	this.port = port;
	this.device = new JSRocket.SyncDevice();
	this.tracks = {};
	this.trackNames = [];
	this.row = 0;

	this.onReady = function() {
		PETRICHOR.initEffects();
		this.setTracks(this.trackNames);

		if (!this.editMode) {
			this.render();
			PETRICHOR.music.play();
		} else {
			PETRICHOR.music.pause();
			PETRICHOR.music.currentTime = this.row / ROW_RATE;
		}
	};

	this.onUpdate = function(newRow) {
		if (!isNaN(newRow)) {
			this.row = newRow;
		}
	};

	this.onPlay = function() {
		PETRICHOR.music.currentTime = this.row / this.ROW_RATE;
		PETRICHOR.music.play();
		this.render();
		console.log('play at row ' + this.row + ' [' + PETRICHOR.music.currentTime + 'ms]');
	};

	this.onPause = function() {
		this.row = PETRICHOR.music.currentTime * this.ROW_RATE;
		window.cancelAnimationFrame(this.render, document);
		PETRICHOR.music.pause();
		console.log('pause at row ' + this.row + ' [' + PETRICHOR.music.currentTime + 'ms]');
	};

	this.init = function() {
		if (this.editMode) {
			if (this.port) {
				this.device.setConfig({
					socketUrl: 'ws://localhost:' + this.port
				});
			}
			this.device.init();
		} else {
			this.device.setConfig({
				rocketXML: this.rocketFile
			});
			this.device.init('demo');
		}

		var that = this;
		this.device.on('ready', function() {
			this.onReady();
		}.bind(this));
		this.device.on('update', function(row) {
			this.onUpdate(row);
		}.bind(this));
		this.device.on('play', function() {
			this.onPlay();
		}.bind(this));
		this.device.on('pause', function() {
			this.onPause();
		}.bind(this));
	};

	this.getTrack = function(trackName) {
		return this.tracks[trackName].getValue(this.row);
	};

	this.setTracks = function(trackNames) {
		var i;
		for (i = 0; i < trackNames.length; i++) {
			this.tracks[trackNames[i]] = this.device.getTrack(trackNames[i]);
		}
	};

	this.render = function() {
		if (PETRICHOR.music.paused === false) {
			this.row = PETRICHOR.music.currentTime * this.ROW_RATE;
			this.device.update(this.row);
		}

		PETRICHOR.play(PETRICHOR.music.currentTime);

		if ((!this.editMode) || (PETRICHOR.music.paused === false)) {
			window.requestAnimationFrame(function() {
				this.render()
			}.bind(this), document);
		} else {
			window.cancelAnimationFrame(function() {
				this.render()
			}.bind(this), document);
		}
	};

	return this;
};

PETRICHOR.sync = null;
PETRICHOR.initSync = function(rocketFile, bpm, rowsPerBeat, editMode, port, trackNames) {
	PETRICHOR.sync = new PETRICHOR.SyncManager(rocketFile, bpm, rowsPerBeat, editMode, port);
	PETRICHOR.sync.trackNames = trackNames;
	PETRICHOR.sync.init();
	return PETRICHOR.sync;
};

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

/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
'use strict';

var PETRICHOR = PETRICHOR || {};

PETRICHOR.FullscreenQuad = function(useDefaultShader) {
	// Create the mesh
	this.mesh = new PETRICHOR.Mesh();
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
	this.program = new PETRICHOR.Program();
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


PETRICHOR.createCube = function() {
	var cube = new PETRICHOR.Mesh();

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

PETRICHOR.createUvSphere = function(radius, nbLatitudes, nbLongitudes) {
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

	sphere = new PETRICHOR.Mesh();
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

PETRICHOR.renderText = function(textureSize, textLines, textHeight, fontStyle, fillColor, strikeColor) {
	var texture = new PETRICHOR.Texture2D(),
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

/**
* @fileoverview gl-matrix - High performance matrix and vector operations
* @author Brandon Jones
* @author Colin MacKenzie IV
* @version 2.2.1
*/

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


(function(_global) {
  "use strict";

  var shim = {};
  if (typeof(exports) === 'undefined') {
    if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
      shim.exports = {};
      define(function() {
        return shim.exports;
      });
    } else {
      // gl-matrix lives in a browser, define its namespaces in global
      shim.exports = typeof(window) !== 'undefined' ? window : _global;
    }
  }
  else {
    // gl-matrix lives in commonjs, define its namespaces in exports
    shim.exports = exports;
  }

  (function(exports) {
    /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


if(!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
}

if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}

if(!GLMAT_RANDOM) {
    var GLMAT_RANDOM = Math.random;
}

/**
* @class Common utilities
* @name glMatrix
*/
var glMatrix = {};

/**
* Sets the type of array used when creating new vectors and matrices
*
* @param {Type} type Array type, such as Float32Array or Array
*/
glMatrix.setMatrixArrayType = function(type) {
    GLMAT_ARRAY_TYPE = type;
}

if(typeof(exports) !== 'undefined') {
    exports.glMatrix = glMatrix;
}

var degree = Math.PI / 180;

/**
* Convert Degree To Radian
*
* @param {Number} Angle in Degrees
*/
glMatrix.toRadian = function(a){
     return a * degree;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
* @class 2 Dimensional Vector
* @name vec2
*/

var vec2 = {};

/**
* Creates a new, empty vec2
*
* @returns {vec2} a new 2D vector
*/
vec2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
* Creates a new vec2 initialized with values from an existing vector
*
* @param {vec2} a vector to clone
* @returns {vec2} a new 2D vector
*/
vec2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
* Creates a new vec2 initialized with the given values
*
* @param {Number} x X component
* @param {Number} y Y component
* @returns {vec2} a new 2D vector
*/
vec2.fromValues = function(x, y) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
* Copy the values from one vec2 to another
*
* @param {vec2} out the receiving vector
* @param {vec2} a the source vector
* @returns {vec2} out
*/
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
* Set the components of a vec2 to the given values
*
* @param {vec2} out the receiving vector
* @param {Number} x X component
* @param {Number} y Y component
* @returns {vec2} out
*/
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
* Adds two vec2's
*
* @param {vec2} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {vec2} out
*/
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
* Subtracts vector b from vector a
*
* @param {vec2} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {vec2} out
*/
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
* Alias for {@link vec2.subtract}
* @function
*/
vec2.sub = vec2.subtract;

/**
* Multiplies two vec2's
*
* @param {vec2} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {vec2} out
*/
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
* Alias for {@link vec2.multiply}
* @function
*/
vec2.mul = vec2.multiply;

/**
* Divides two vec2's
*
* @param {vec2} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {vec2} out
*/
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
* Alias for {@link vec2.divide}
* @function
*/
vec2.div = vec2.divide;

/**
* Returns the minimum of two vec2's
*
* @param {vec2} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {vec2} out
*/
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
* Returns the maximum of two vec2's
*
* @param {vec2} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {vec2} out
*/
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
* Scales a vec2 by a scalar number
*
* @param {vec2} out the receiving vector
* @param {vec2} a the vector to scale
* @param {Number} b amount to scale the vector by
* @returns {vec2} out
*/
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
* Adds two vec2's after scaling the second operand by a scalar value
*
* @param {vec2} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @param {Number} scale the amount to scale b by before adding
* @returns {vec2} out
*/
vec2.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};

/**
* Calculates the euclidian distance between two vec2's
*
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {Number} distance between a and b
*/
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
* Alias for {@link vec2.distance}
* @function
*/
vec2.dist = vec2.distance;

/**
* Calculates the squared euclidian distance between two vec2's
*
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {Number} squared distance between a and b
*/
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
* Alias for {@link vec2.squaredDistance}
* @function
*/
vec2.sqrDist = vec2.squaredDistance;

/**
* Calculates the length of a vec2
*
* @param {vec2} a vector to calculate length of
* @returns {Number} length of a
*/
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
* Alias for {@link vec2.length}
* @function
*/
vec2.len = vec2.length;

/**
* Calculates the squared length of a vec2
*
* @param {vec2} a vector to calculate squared length of
* @returns {Number} squared length of a
*/
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
* Alias for {@link vec2.squaredLength}
* @function
*/
vec2.sqrLen = vec2.squaredLength;

/**
* Negates the components of a vec2
*
* @param {vec2} out the receiving vector
* @param {vec2} a vector to negate
* @returns {vec2} out
*/
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
* Normalize a vec2
*
* @param {vec2} out the receiving vector
* @param {vec2} a vector to normalize
* @returns {vec2} out
*/
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
* Calculates the dot product of two vec2's
*
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {Number} dot product of a and b
*/
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
* Computes the cross product of two vec2's
* Note that the cross product must by definition produce a 3D vector
*
* @param {vec3} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @returns {vec3} out
*/
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
* Performs a linear interpolation between two vec2's
*
* @param {vec2} out the receiving vector
* @param {vec2} a the first operand
* @param {vec2} b the second operand
* @param {Number} t interpolation amount between the two inputs
* @returns {vec2} out
*/
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
* Generates a random vector with the given scale
*
* @param {vec2} out the receiving vector
* @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
* @returns {vec2} out
*/
vec2.random = function (out, scale) {
    scale = scale || 1.0;
    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
};

/**
* Transforms the vec2 with a mat2
*
* @param {vec2} out the receiving vector
* @param {vec2} a the vector to transform
* @param {mat2} m matrix to transform with
* @returns {vec2} out
*/
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
* Transforms the vec2 with a mat2d
*
* @param {vec2} out the receiving vector
* @param {vec2} a the vector to transform
* @param {mat2d} m matrix to transform with
* @returns {vec2} out
*/
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
* Transforms the vec2 with a mat3
* 3rd vector component is implicitly '1'
*
* @param {vec2} out the receiving vector
* @param {vec2} a the vector to transform
* @param {mat3} m matrix to transform with
* @returns {vec2} out
*/
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
* Transforms the vec2 with a mat4
* 3rd vector component is implicitly '0'
* 4th vector component is implicitly '1'
*
* @param {vec2} out the receiving vector
* @param {vec2} a the vector to transform
* @param {mat4} m matrix to transform with
* @returns {vec2} out
*/
vec2.transformMat4 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
* Perform some operation over an array of vec2s.
*
* @param {Array} a the array of vectors to iterate over
* @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
* @param {Number} offset Number of elements to skip at the beginning of the array
* @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
* @param {Function} fn Function to call for each vector in the array
* @param {Object} [arg] additional argument to pass to fn
* @returns {Array} a
* @function
*/
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
* Returns a string representation of a vector
*
* @param {vec2} vec vector to represent as a string
* @returns {String} string representation of the vector
*/
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec2 = vec2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
* @class 3 Dimensional Vector
* @name vec3
*/

var vec3 = {};

/**
* Creates a new, empty vec3
*
* @returns {vec3} a new 3D vector
*/
vec3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
* Creates a new vec3 initialized with values from an existing vector
*
* @param {vec3} a vector to clone
* @returns {vec3} a new 3D vector
*/
vec3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
* Creates a new vec3 initialized with the given values
*
* @param {Number} x X component
* @param {Number} y Y component
* @param {Number} z Z component
* @returns {vec3} a new 3D vector
*/
vec3.fromValues = function(x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
* Copy the values from one vec3 to another
*
* @param {vec3} out the receiving vector
* @param {vec3} a the source vector
* @returns {vec3} out
*/
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
* Set the components of a vec3 to the given values
*
* @param {vec3} out the receiving vector
* @param {Number} x X component
* @param {Number} y Y component
* @param {Number} z Z component
* @returns {vec3} out
*/
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
* Adds two vec3's
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {vec3} out
*/
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
* Subtracts vector b from vector a
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {vec3} out
*/
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
* Alias for {@link vec3.subtract}
* @function
*/
vec3.sub = vec3.subtract;

/**
* Multiplies two vec3's
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {vec3} out
*/
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
* Alias for {@link vec3.multiply}
* @function
*/
vec3.mul = vec3.multiply;

/**
* Divides two vec3's
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {vec3} out
*/
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
* Alias for {@link vec3.divide}
* @function
*/
vec3.div = vec3.divide;

/**
* Returns the minimum of two vec3's
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {vec3} out
*/
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
* Returns the maximum of two vec3's
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {vec3} out
*/
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
* Scales a vec3 by a scalar number
*
* @param {vec3} out the receiving vector
* @param {vec3} a the vector to scale
* @param {Number} b amount to scale the vector by
* @returns {vec3} out
*/
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
* Adds two vec3's after scaling the second operand by a scalar value
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @param {Number} scale the amount to scale b by before adding
* @returns {vec3} out
*/
vec3.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    return out;
};

/**
* Calculates the euclidian distance between two vec3's
*
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {Number} distance between a and b
*/
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
* Alias for {@link vec3.distance}
* @function
*/
vec3.dist = vec3.distance;

/**
* Calculates the squared euclidian distance between two vec3's
*
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {Number} squared distance between a and b
*/
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
* Alias for {@link vec3.squaredDistance}
* @function
*/
vec3.sqrDist = vec3.squaredDistance;

/**
* Calculates the length of a vec3
*
* @param {vec3} a vector to calculate length of
* @returns {Number} length of a
*/
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
* Alias for {@link vec3.length}
* @function
*/
vec3.len = vec3.length;

/**
* Calculates the squared length of a vec3
*
* @param {vec3} a vector to calculate squared length of
* @returns {Number} squared length of a
*/
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
* Alias for {@link vec3.squaredLength}
* @function
*/
vec3.sqrLen = vec3.squaredLength;

/**
* Negates the components of a vec3
*
* @param {vec3} out the receiving vector
* @param {vec3} a vector to negate
* @returns {vec3} out
*/
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
* Normalize a vec3
*
* @param {vec3} out the receiving vector
* @param {vec3} a vector to normalize
* @returns {vec3} out
*/
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
* Calculates the dot product of two vec3's
*
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {Number} dot product of a and b
*/
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
* Computes the cross product of two vec3's
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @returns {vec3} out
*/
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
* Performs a linear interpolation between two vec3's
*
* @param {vec3} out the receiving vector
* @param {vec3} a the first operand
* @param {vec3} b the second operand
* @param {Number} t interpolation amount between the two inputs
* @returns {vec3} out
*/
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
* Generates a random vector with the given scale
*
* @param {vec3} out the receiving vector
* @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
* @returns {vec3} out
*/
vec3.random = function (out, scale) {
    scale = scale || 1.0;

    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    var z = (GLMAT_RANDOM() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
};

/**
* Transforms the vec3 with a mat4.
* 4th vector component is implicitly '1'
*
* @param {vec3} out the receiving vector
* @param {vec3} a the vector to transform
* @param {mat4} m matrix to transform with
* @returns {vec3} out
*/
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
};

/**
* Transforms the vec3 with a mat3.
*
* @param {vec3} out the receiving vector
* @param {vec3} a the vector to transform
* @param {mat4} m the 3x3 matrix to transform with
* @returns {vec3} out
*/
vec3.transformMat3 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
};

/**
* Transforms the vec3 with a quat
*
* @param {vec3} out the receiving vector
* @param {vec3} a the vector to transform
* @param {quat} q quaternion to transform with
* @returns {vec3} out
*/
vec3.transformQuat = function(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/*
* Rotate a 3D vector around the x-axis
* @param {vec3} out The receiving vec3
* @param {vec3} a The vec3 point to rotate
* @param {vec3} b The origin of the rotation
* @param {Number} c The angle of rotation
* @returns {vec3} out
*/
vec3.rotateX = function(out, a, b, c){
   var p = [], r=[];
//Translate point to the origin
p[0] = a[0] - b[0];
p[1] = a[1] - b[1];
   p[2] = a[2] - b[2];

//perform rotation
r[0] = p[0];
r[1] = p[1]*Math.cos(c) - p[2]*Math.sin(c);
r[2] = p[1]*Math.sin(c) + p[2]*Math.cos(c);

//translate to correct position
out[0] = r[0] + b[0];
out[1] = r[1] + b[1];
out[2] = r[2] + b[2];

   return out;
};

/*
* Rotate a 3D vector around the y-axis
* @param {vec3} out The receiving vec3
* @param {vec3} a The vec3 point to rotate
* @param {vec3} b The origin of the rotation
* @param {Number} c The angle of rotation
* @returns {vec3} out
*/
vec3.rotateY = function(out, a, b, c){
   var p = [], r=[];
   //Translate point to the origin
   p[0] = a[0] - b[0];
   p[1] = a[1] - b[1];
   p[2] = a[2] - b[2];
  
   //perform rotation
   r[0] = p[2]*Math.sin(c) + p[0]*Math.cos(c);
   r[1] = p[1];
   r[2] = p[2]*Math.cos(c) - p[0]*Math.sin(c);
  
   //translate to correct position
   out[0] = r[0] + b[0];
   out[1] = r[1] + b[1];
   out[2] = r[2] + b[2];
  
   return out;
};

/*
* Rotate a 3D vector around the z-axis
* @param {vec3} out The receiving vec3
* @param {vec3} a The vec3 point to rotate
* @param {vec3} b The origin of the rotation
* @param {Number} c The angle of rotation
* @returns {vec3} out
*/
vec3.rotateZ = function(out, a, b, c){
   var p = [], r=[];
   //Translate point to the origin
   p[0] = a[0] - b[0];
   p[1] = a[1] - b[1];
   p[2] = a[2] - b[2];
  
   //perform rotation
   r[0] = p[0]*Math.cos(c) - p[1]*Math.sin(c);
   r[1] = p[0]*Math.sin(c) + p[1]*Math.cos(c);
   r[2] = p[2];
  
   //translate to correct position
   out[0] = r[0] + b[0];
   out[1] = r[1] + b[1];
   out[2] = r[2] + b[2];
  
   return out;
};

/**
* Perform some operation over an array of vec3s.
*
* @param {Array} a the array of vectors to iterate over
* @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
* @param {Number} offset Number of elements to skip at the beginning of the array
* @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
* @param {Function} fn Function to call for each vector in the array
* @param {Object} [arg] additional argument to pass to fn
* @returns {Array} a
* @function
*/
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
* Returns a string representation of a vector
*
* @param {vec3} vec vector to represent as a string
* @returns {String} string representation of the vector
*/
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec3 = vec3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
* @class 4 Dimensional Vector
* @name vec4
*/

var vec4 = {};

/**
* Creates a new, empty vec4
*
* @returns {vec4} a new 4D vector
*/
vec4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
* Creates a new vec4 initialized with values from an existing vector
*
* @param {vec4} a vector to clone
* @returns {vec4} a new 4D vector
*/
vec4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
* Creates a new vec4 initialized with the given values
*
* @param {Number} x X component
* @param {Number} y Y component
* @param {Number} z Z component
* @param {Number} w W component
* @returns {vec4} a new 4D vector
*/
vec4.fromValues = function(x, y, z, w) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
* Copy the values from one vec4 to another
*
* @param {vec4} out the receiving vector
* @param {vec4} a the source vector
* @returns {vec4} out
*/
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
* Set the components of a vec4 to the given values
*
* @param {vec4} out the receiving vector
* @param {Number} x X component
* @param {Number} y Y component
* @param {Number} z Z component
* @param {Number} w W component
* @returns {vec4} out
*/
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
* Adds two vec4's
*
* @param {vec4} out the receiving vector
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {vec4} out
*/
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
* Subtracts vector b from vector a
*
* @param {vec4} out the receiving vector
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {vec4} out
*/
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
* Alias for {@link vec4.subtract}
* @function
*/
vec4.sub = vec4.subtract;

/**
* Multiplies two vec4's
*
* @param {vec4} out the receiving vector
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {vec4} out
*/
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
* Alias for {@link vec4.multiply}
* @function
*/
vec4.mul = vec4.multiply;

/**
* Divides two vec4's
*
* @param {vec4} out the receiving vector
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {vec4} out
*/
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
* Alias for {@link vec4.divide}
* @function
*/
vec4.div = vec4.divide;

/**
* Returns the minimum of two vec4's
*
* @param {vec4} out the receiving vector
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {vec4} out
*/
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
* Returns the maximum of two vec4's
*
* @param {vec4} out the receiving vector
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {vec4} out
*/
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
* Scales a vec4 by a scalar number
*
* @param {vec4} out the receiving vector
* @param {vec4} a the vector to scale
* @param {Number} b amount to scale the vector by
* @returns {vec4} out
*/
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
* Adds two vec4's after scaling the second operand by a scalar value
*
* @param {vec4} out the receiving vector
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @param {Number} scale the amount to scale b by before adding
* @returns {vec4} out
*/
vec4.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

/**
* Calculates the euclidian distance between two vec4's
*
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {Number} distance between a and b
*/
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
* Alias for {@link vec4.distance}
* @function
*/
vec4.dist = vec4.distance;

/**
* Calculates the squared euclidian distance between two vec4's
*
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {Number} squared distance between a and b
*/
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
* Alias for {@link vec4.squaredDistance}
* @function
*/
vec4.sqrDist = vec4.squaredDistance;

/**
* Calculates the length of a vec4
*
* @param {vec4} a vector to calculate length of
* @returns {Number} length of a
*/
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
* Alias for {@link vec4.length}
* @function
*/
vec4.len = vec4.length;

/**
* Calculates the squared length of a vec4
*
* @param {vec4} a vector to calculate squared length of
* @returns {Number} squared length of a
*/
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
* Alias for {@link vec4.squaredLength}
* @function
*/
vec4.sqrLen = vec4.squaredLength;

/**
* Negates the components of a vec4
*
* @param {vec4} out the receiving vector
* @param {vec4} a vector to negate
* @returns {vec4} out
*/
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
* Normalize a vec4
*
* @param {vec4} out the receiving vector
* @param {vec4} a vector to normalize
* @returns {vec4} out
*/
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        out[3] = a[3] * len;
    }
    return out;
};

/**
* Calculates the dot product of two vec4's
*
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @returns {Number} dot product of a and b
*/
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
* Performs a linear interpolation between two vec4's
*
* @param {vec4} out the receiving vector
* @param {vec4} a the first operand
* @param {vec4} b the second operand
* @param {Number} t interpolation amount between the two inputs
* @returns {vec4} out
*/
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
* Generates a random vector with the given scale
*
* @param {vec4} out the receiving vector
* @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
* @returns {vec4} out
*/
vec4.random = function (out, scale) {
    scale = scale || 1.0;

    //TODO: This is a pretty awful way of doing this. Find something better.
    out[0] = GLMAT_RANDOM();
    out[1] = GLMAT_RANDOM();
    out[2] = GLMAT_RANDOM();
    out[3] = GLMAT_RANDOM();
    vec4.normalize(out, out);
    vec4.scale(out, out, scale);
    return out;
};

/**
* Transforms the vec4 with a mat4.
*
* @param {vec4} out the receiving vector
* @param {vec4} a the vector to transform
* @param {mat4} m matrix to transform with
* @returns {vec4} out
*/
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
* Transforms the vec4 with a quat
*
* @param {vec4} out the receiving vector
* @param {vec4} a the vector to transform
* @param {quat} q quaternion to transform with
* @returns {vec4} out
*/
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
* Perform some operation over an array of vec4s.
*
* @param {Array} a the array of vectors to iterate over
* @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
* @param {Number} offset Number of elements to skip at the beginning of the array
* @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
* @param {Function} fn Function to call for each vector in the array
* @param {Object} [arg] additional argument to pass to fn
* @returns {Array} a
* @function
*/
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
* Returns a string representation of a vector
*
* @param {vec4} vec vector to represent as a string
* @returns {String} string representation of the vector
*/
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec4 = vec4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
* @class 2x2 Matrix
* @name mat2
*/

var mat2 = {};

/**
* Creates a new identity mat2
*
* @returns {mat2} a new 2x2 matrix
*/
mat2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
* Creates a new mat2 initialized with values from an existing matrix
*
* @param {mat2} a matrix to clone
* @returns {mat2} a new 2x2 matrix
*/
mat2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
* Copy the values from one mat2 to another
*
* @param {mat2} out the receiving matrix
* @param {mat2} a the source matrix
* @returns {mat2} out
*/
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
* Set a mat2 to the identity matrix
*
* @param {mat2} out the receiving matrix
* @returns {mat2} out
*/
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
* Transpose the values of a mat2
*
* @param {mat2} out the receiving matrix
* @param {mat2} a the source matrix
* @returns {mat2} out
*/
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
* Inverts a mat2
*
* @param {mat2} out the receiving matrix
* @param {mat2} a the source matrix
* @returns {mat2} out
*/
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] = a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] = a0 * det;

    return out;
};

/**
* Calculates the adjugate of a mat2
*
* @param {mat2} out the receiving matrix
* @param {mat2} a the source matrix
* @returns {mat2} out
*/
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] = a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a0;

    return out;
};

/**
* Calculates the determinant of a mat2
*
* @param {mat2} a the source matrix
* @returns {Number} determinant of a
*/
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
* Multiplies two mat2's
*
* @param {mat2} out the receiving matrix
* @param {mat2} a the first operand
* @param {mat2} b the second operand
* @returns {mat2} out
*/
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    return out;
};

/**
* Alias for {@link mat2.multiply}
* @function
*/
mat2.mul = mat2.multiply;

/**
* Rotates a mat2 by the given angle
*
* @param {mat2} out the receiving matrix
* @param {mat2} a the matrix to rotate
* @param {Number} rad the angle to rotate the matrix by
* @returns {mat2} out
*/
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 * c + a2 * s;
    out[1] = a1 * c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    return out;
};

/**
* Scales the mat2 by the dimensions in the given vec2
*
* @param {mat2} out the receiving matrix
* @param {mat2} a the matrix to rotate
* @param {vec2} v the vec2 to scale the matrix by
* @returns {mat2} out
**/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    return out;
};

/**
* Returns a string representation of a mat2
*
* @param {mat2} mat matrix to represent as a string
* @returns {String} string representation of the matrix
*/
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
* Returns Frobenius norm of a mat2
*
* @param {mat2} a the matrix to calculate Frobenius norm of
* @returns {Number} Frobenius norm
*/
mat2.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2)))
};

/**
* Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
* @param {mat2} L the lower triangular matrix
* @param {mat2} D the diagonal matrix
* @param {mat2} U the upper triangular matrix
* @param {mat2} a the input matrix to factorize
*/

mat2.LDU = function (L, D, U, a) {
    L[2] = a[2]/a[0];
    U[0] = a[0];
    U[1] = a[1];
    U[3] = a[3] - L[2] * U[1];
    return [L, D, U];
};

if(typeof(exports) !== 'undefined') {
    exports.mat2 = mat2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
* @class 2x3 Matrix
* @name mat2d
*
* @description
* A mat2d contains six elements defined as:
* <pre>
* [a, c, tx,
* b, d, ty]
* </pre>
* This is a short form for the 3x3 matrix:
* <pre>
* [a, c, tx,
* b, d, ty,
* 0, 0, 1]
* </pre>
* The last row is ignored so the array is shorter and operations are faster.
*/

var mat2d = {};

/**
* Creates a new identity mat2d
*
* @returns {mat2d} a new 2x3 matrix
*/
mat2d.create = function() {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
* Creates a new mat2d initialized with values from an existing matrix
*
* @param {mat2d} a matrix to clone
* @returns {mat2d} a new 2x3 matrix
*/
mat2d.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
* Copy the values from one mat2d to another
*
* @param {mat2d} out the receiving matrix
* @param {mat2d} a the source matrix
* @returns {mat2d} out
*/
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
* Set a mat2d to the identity matrix
*
* @param {mat2d} out the receiving matrix
* @returns {mat2d} out
*/
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
* Inverts a mat2d
*
* @param {mat2d} out the receiving matrix
* @param {mat2d} a the source matrix
* @returns {mat2d} out
*/
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
* Calculates the determinant of a mat2d
*
* @param {mat2d} a the source matrix
* @returns {Number} determinant of a
*/
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
* Multiplies two mat2d's
*
* @param {mat2d} out the receiving matrix
* @param {mat2d} a the first operand
* @param {mat2d} b the second operand
* @returns {mat2d} out
*/
mat2d.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    out[4] = a0 * b4 + a2 * b5 + a4;
    out[5] = a1 * b4 + a3 * b5 + a5;
    return out;
};

/**
* Alias for {@link mat2d.multiply}
* @function
*/
mat2d.mul = mat2d.multiply;


/**
* Rotates a mat2d by the given angle
*
* @param {mat2d} out the receiving matrix
* @param {mat2d} a the matrix to rotate
* @param {Number} rad the angle to rotate the matrix by
* @returns {mat2d} out
*/
mat2d.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 * c + a2 * s;
    out[1] = a1 * c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
* Scales the mat2d by the dimensions in the given vec2
*
* @param {mat2d} out the receiving matrix
* @param {mat2d} a the matrix to translate
* @param {vec2} v the vec2 to scale the matrix by
* @returns {mat2d} out
**/
mat2d.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
* Translates the mat2d by the dimensions in the given vec2
*
* @param {mat2d} out the receiving matrix
* @param {mat2d} a the matrix to translate
* @param {vec2} v the vec2 to translate the matrix by
* @returns {mat2d} out
**/
mat2d.translate = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a0 * v0 + a2 * v1 + a4;
    out[5] = a1 * v0 + a3 * v1 + a5;
    return out;
};

/**
* Returns a string representation of a mat2d
*
* @param {mat2d} a matrix to represent as a string
* @returns {String} string representation of the matrix
*/
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' +
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

/**
* Returns Frobenius norm of a mat2d
*
* @param {mat2d} a the matrix to calculate Frobenius norm of
* @returns {Number} Frobenius norm
*/
mat2d.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + 1))
};

if(typeof(exports) !== 'undefined') {
    exports.mat2d = mat2d;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
* @class 3x3 Matrix
* @name mat3
*/

var mat3 = {};

/**
* Creates a new identity mat3
*
* @returns {mat3} a new 3x3 matrix
*/
mat3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
* Copies the upper-left 3x3 values into the given mat3.
*
* @param {mat3} out the receiving 3x3 matrix
* @param {mat4} a the source 4x4 matrix
* @returns {mat3} out
*/
mat3.fromMat4 = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
};

/**
* Creates a new mat3 initialized with values from an existing matrix
*
* @param {mat3} a matrix to clone
* @returns {mat3} a new 3x3 matrix
*/
mat3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
* Copy the values from one mat3 to another
*
* @param {mat3} out the receiving matrix
* @param {mat3} a the source matrix
* @returns {mat3} out
*/
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
* Set a mat3 to the identity matrix
*
* @param {mat3} out the receiving matrix
* @returns {mat3} out
*/
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
* Transpose the values of a mat3
*
* @param {mat3} out the receiving matrix
* @param {mat3} a the source matrix
* @returns {mat3} out
*/
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
* Inverts a mat3
*
* @param {mat3} out the receiving matrix
* @param {mat3} a the source matrix
* @returns {mat3} out
*/
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
* Calculates the adjugate of a mat3
*
* @param {mat3} out the receiving matrix
* @param {mat3} a the source matrix
* @returns {mat3} out
*/
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
* Calculates the determinant of a mat3
*
* @param {mat3} a the source matrix
* @returns {Number} determinant of a
*/
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
* Multiplies two mat3's
*
* @param {mat3} out the receiving matrix
* @param {mat3} a the first operand
* @param {mat3} b the second operand
* @returns {mat3} out
*/
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
* Alias for {@link mat3.multiply}
* @function
*/
mat3.mul = mat3.multiply;

/**
* Translate a mat3 by the given vector
*
* @param {mat3} out the receiving matrix
* @param {mat3} a the matrix to translate
* @param {vec2} v vector to translate by
* @returns {mat3} out
*/
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
* Rotates a mat3 by the given angle
*
* @param {mat3} out the receiving matrix
* @param {mat3} a the matrix to rotate
* @param {Number} rad the angle to rotate the matrix by
* @returns {mat3} out
*/
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
* Scales the mat3 by the dimensions in the given vec2
*
* @param {mat3} out the receiving matrix
* @param {mat3} a the matrix to rotate
* @param {vec2} v the vec2 to scale the matrix by
* @returns {mat3} out
**/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[1];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
* Copies the values from a mat2d into a mat3
*
* @param {mat3} out the receiving matrix
* @param {mat2d} a the matrix to copy
* @returns {mat3} out
**/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
* Returns a string representation of a mat3
*
* @param {mat3} mat matrix to represent as a string
* @returns {String} string representation of the matrix
*/
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' +
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' +
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

/**
* Returns Frobenius norm of a mat3
*
* @param {mat3} a the matrix to calculate Frobenius norm of
* @returns {Number} Frobenius norm
*/
mat3.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2)))
};


if(typeof(exports) !== 'undefined') {
    exports.mat3 = mat3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
* @class 4x4 Matrix
* @name mat4
*/

var mat4 = {};

/**
* Creates a new identity mat4
*
* @returns {mat4} a new 4x4 matrix
*/
mat4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
* Creates a new mat4 initialized with values from an existing matrix
*
* @param {mat4} a matrix to clone
* @returns {mat4} a new 4x4 matrix
*/
mat4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
* Copy the values from one mat4 to another
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the source matrix
* @returns {mat4} out
*/
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
* Set a mat4 to the identity matrix
*
* @param {mat4} out the receiving matrix
* @returns {mat4} out
*/
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
* Transpose the values of a mat4
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the source matrix
* @returns {mat4} out
*/
mat4.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};

/**
* Inverts a mat4
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the source matrix
* @returns {mat4} out
*/
mat4.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
* Calculates the adjugate of a mat4
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the source matrix
* @returns {mat4} out
*/
mat4.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0] = (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2] = (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5] = (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7] = (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8] = (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] = (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] = (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] = (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
* Calculates the determinant of a mat4
*
* @param {mat4} a the source matrix
* @returns {Number} determinant of a
*/
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
* Multiplies two mat4's
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the first operand
* @param {mat4} b the second operand
* @returns {mat4} out
*/
mat4.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
* Alias for {@link mat4.multiply}
* @function
*/
mat4.mul = mat4.multiply;

/**
* Translate a mat4 by the given vector
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the matrix to translate
* @param {vec3} v vector to translate by
* @returns {mat4} out
*/
mat4.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

/**
* Scales the mat4 by the dimensions in the given vec3
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the matrix to scale
* @param {vec3} v the vec3 to scale the matrix by
* @returns {mat4} out
**/
mat4.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
* Rotates a mat4 by the given angle
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the matrix to rotate
* @param {Number} rad the angle to rotate the matrix by
* @param {vec3} axis the axis to rotate around
* @returns {mat4} out
*/
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < GLMAT_EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
* Rotates a matrix by the given angle around the X axis
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the matrix to rotate
* @param {Number} rad the angle to rotate the matrix by
* @returns {mat4} out
*/
mat4.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
* Rotates a matrix by the given angle around the Y axis
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the matrix to rotate
* @param {Number} rad the angle to rotate the matrix by
* @returns {mat4} out
*/
mat4.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
* Rotates a matrix by the given angle around the Z axis
*
* @param {mat4} out the receiving matrix
* @param {mat4} a the matrix to rotate
* @param {Number} rad the angle to rotate the matrix by
* @returns {mat4} out
*/
mat4.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
* Creates a matrix from a quaternion rotation and vector translation
* This is equivalent to (but much faster than):
*
* mat4.identity(dest);
* mat4.translate(dest, vec);
* var quatMat = mat4.create();
* quat4.toMat4(quat, quatMat);
* mat4.multiply(dest, quatMat);
*
* @param {mat4} out mat4 receiving operation result
* @param {quat4} q Rotation quaternion
* @param {vec3} v Translation vector
* @returns {mat4} out
*/
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};

mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
* Generates a frustum matrix with the given bounds
*
* @param {mat4} out mat4 frustum matrix will be written into
* @param {Number} left Left bound of the frustum
* @param {Number} right Right bound of the frustum
* @param {Number} bottom Bottom bound of the frustum
* @param {Number} top Top bound of the frustum
* @param {Number} near Near bound of the frustum
* @param {Number} far Far bound of the frustum
* @returns {mat4} out
*/
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
* Generates a perspective projection matrix with the given bounds
*
* @param {mat4} out mat4 frustum matrix will be written into
* @param {number} fovy Vertical field of view in radians
* @param {number} aspect Aspect ratio. typically viewport width/height
* @param {number} near Near bound of the frustum
* @param {number} far Far bound of the frustum
* @returns {mat4} out
*/
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
* Generates a orthogonal projection matrix with the given bounds
*
* @param {mat4} out mat4 frustum matrix will be written into
* @param {number} left Left bound of the frustum
* @param {number} right Right bound of the frustum
* @param {number} bottom Bottom bound of the frustum
* @param {number} top Top bound of the frustum
* @param {number} near Near bound of the frustum
* @param {number} far Far bound of the frustum
* @returns {mat4} out
*/
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
* Generates a look-at matrix with the given eye position, focal point, and up axis
*
* @param {mat4} out mat4 frustum matrix will be written into
* @param {vec3} eye Position of the viewer
* @param {vec3} center Point the viewer is looking at
* @param {vec3} up vec3 pointing up
* @returns {mat4} out
*/
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
        Math.abs(eyey - centery) < GLMAT_EPSILON &&
        Math.abs(eyez - centerz) < GLMAT_EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
* Returns a string representation of a mat4
*
* @param {mat4} mat matrix to represent as a string
* @returns {String} string representation of the matrix
*/
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' +
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

/**
* Returns Frobenius norm of a mat4
*
* @param {mat4} a the matrix to calculate Frobenius norm of
* @returns {Number} Frobenius norm
*/
mat4.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2) ))
};


if(typeof(exports) !== 'undefined') {
    exports.mat4 = mat4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
* @class Quaternion
* @name quat
*/

var quat = {};

/**
* Creates a new identity quat
*
* @returns {quat} a new quaternion
*/
quat.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
* Sets a quaternion to represent the shortest rotation from one
* vector to another.
*
* Both vectors are assumed to be unit length.
*
* @param {quat} out the receiving quaternion.
* @param {vec3} a the initial vector
* @param {vec3} b the destination vector
* @returns {quat} out
*/
quat.rotationTo = (function() {
    var tmpvec3 = vec3.create();
    var xUnitVec3 = vec3.fromValues(1,0,0);
    var yUnitVec3 = vec3.fromValues(0,1,0);

    return function(out, a, b) {
        var dot = vec3.dot(a, b);
        if (dot < -0.999999) {
            vec3.cross(tmpvec3, xUnitVec3, a);
            if (vec3.length(tmpvec3) < 0.000001)
                vec3.cross(tmpvec3, yUnitVec3, a);
            vec3.normalize(tmpvec3, tmpvec3);
            quat.setAxisAngle(out, tmpvec3, Math.PI);
            return out;
        } else if (dot > 0.999999) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        } else {
            vec3.cross(tmpvec3, a, b);
            out[0] = tmpvec3[0];
            out[1] = tmpvec3[1];
            out[2] = tmpvec3[2];
            out[3] = 1 + dot;
            return quat.normalize(out, out);
        }
    };
})();

/**
* Sets the specified quaternion with values corresponding to the given
* axes. Each axis is a vec3 and is expected to be unit length and
* perpendicular to all other specified axes.
*
* @param {vec3} view the vector representing the viewing direction
* @param {vec3} right the vector representing the local "right" direction
* @param {vec3} up the vector representing the local "up" direction
* @returns {quat} out
*/
quat.setAxes = (function() {
    var matr = mat3.create();

    return function(out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];

        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];

        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];

        return quat.normalize(out, quat.fromMat3(out, matr));
    };
})();

/**
* Creates a new quat initialized with values from an existing quaternion
*
* @param {quat} a quaternion to clone
* @returns {quat} a new quaternion
* @function
*/
quat.clone = vec4.clone;

/**
* Creates a new quat initialized with the given values
*
* @param {Number} x X component
* @param {Number} y Y component
* @param {Number} z Z component
* @param {Number} w W component
* @returns {quat} a new quaternion
* @function
*/
quat.fromValues = vec4.fromValues;

/**
* Copy the values from one quat to another
*
* @param {quat} out the receiving quaternion
* @param {quat} a the source quaternion
* @returns {quat} out
* @function
*/
quat.copy = vec4.copy;

/**
* Set the components of a quat to the given values
*
* @param {quat} out the receiving quaternion
* @param {Number} x X component
* @param {Number} y Y component
* @param {Number} z Z component
* @param {Number} w W component
* @returns {quat} out
* @function
*/
quat.set = vec4.set;

/**
* Set a quat to the identity quaternion
*
* @param {quat} out the receiving quaternion
* @returns {quat} out
*/
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
* Sets a quat from the given angle and rotation axis,
* then returns it.
*
* @param {quat} out the receiving quaternion
* @param {vec3} axis the axis around which to rotate
* @param {Number} rad the angle in radians
* @returns {quat} out
**/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
* Adds two quat's
*
* @param {quat} out the receiving quaternion
* @param {quat} a the first operand
* @param {quat} b the second operand
* @returns {quat} out
* @function
*/
quat.add = vec4.add;

/**
* Multiplies two quat's
*
* @param {quat} out the receiving quaternion
* @param {quat} a the first operand
* @param {quat} b the second operand
* @returns {quat} out
*/
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
* Alias for {@link quat.multiply}
* @function
*/
quat.mul = quat.multiply;

/**
* Scales a quat by a scalar number
*
* @param {quat} out the receiving vector
* @param {quat} a the vector to scale
* @param {Number} b amount to scale the vector by
* @returns {quat} out
* @function
*/
quat.scale = vec4.scale;

/**
* Rotates a quaternion by the given angle about the X axis
*
* @param {quat} out quat receiving operation result
* @param {quat} a quat to rotate
* @param {number} rad angle (in radians) to rotate
* @returns {quat} out
*/
quat.rotateX = function (out, a, rad) {
    rad *= 0.5;

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
* Rotates a quaternion by the given angle about the Y axis
*
* @param {quat} out quat receiving operation result
* @param {quat} a quat to rotate
* @param {number} rad angle (in radians) to rotate
* @returns {quat} out
*/
quat.rotateY = function (out, a, rad) {
    rad *= 0.5;

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
* Rotates a quaternion by the given angle about the Z axis
*
* @param {quat} out quat receiving operation result
* @param {quat} a quat to rotate
* @param {number} rad angle (in radians) to rotate
* @returns {quat} out
*/
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5;

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
* Calculates the W component of a quat from the X, Y, and Z components.
* Assumes that quaternion is 1 unit in length.
* Any existing W component will be ignored.
*
* @param {quat} out the receiving quaternion
* @param {quat} a quat to calculate W component of
* @returns {quat} out
*/
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
* Calculates the dot product of two quat's
*
* @param {quat} a the first operand
* @param {quat} b the second operand
* @returns {Number} dot product of a and b
* @function
*/
quat.dot = vec4.dot;

/**
* Performs a linear interpolation between two quat's
*
* @param {quat} out the receiving quaternion
* @param {quat} a the first operand
* @param {quat} b the second operand
* @param {Number} t interpolation amount between the two inputs
* @returns {quat} out
* @function
*/
quat.lerp = vec4.lerp;

/**
* Performs a spherical linear interpolation between two quat
*
* @param {quat} out the receiving quaternion
* @param {quat} a the first operand
* @param {quat} b the second operand
* @param {Number} t interpolation amount between the two inputs
* @returns {quat} out
*/
quat.slerp = function (out, a, b, t) {
    // benchmarks:
    // http://jsperf.com/quaternion-slerp-implementations

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {
        // "from" and "to" quaternions are very close
        // ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    
    return out;
};

/**
* Calculates the inverse of a quat
*
* @param {quat} out the receiving quaternion
* @param {quat} a quat to calculate inverse of
* @returns {quat} out
*/
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
* Calculates the conjugate of a quat
* If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
*
* @param {quat} out the receiving quaternion
* @param {quat} a quat to calculate conjugate of
* @returns {quat} out
*/
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
* Calculates the length of a quat
*
* @param {quat} a vector to calculate length of
* @returns {Number} length of a
* @function
*/
quat.length = vec4.length;

/**
* Alias for {@link quat.length}
* @function
*/
quat.len = quat.length;

/**
* Calculates the squared length of a quat
*
* @param {quat} a vector to calculate squared length of
* @returns {Number} squared length of a
* @function
*/
quat.squaredLength = vec4.squaredLength;

/**
* Alias for {@link quat.squaredLength}
* @function
*/
quat.sqrLen = quat.squaredLength;

/**
* Normalize a quat
*
* @param {quat} out the receiving quaternion
* @param {quat} a quaternion to normalize
* @returns {quat} out
* @function
*/
quat.normalize = vec4.normalize;

/**
* Creates a quaternion from the given 3x3 rotation matrix.
*
* NOTE: The resultant quaternion is not normalized, so you should be sure
* to renormalize the quaternion yourself where necessary.
*
* @param {quat} out the receiving quaternion
* @param {mat3} m rotation matrix
* @returns {quat} out
* @function
*/
quat.fromMat3 = function(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0); // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5/fRoot; // 1/(4w)
        out[0] = (m[7]-m[5])*fRoot;
        out[1] = (m[2]-m[6])*fRoot;
        out[2] = (m[3]-m[1])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = (i+1)%3;
        var k = (i+2)%3;
        
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[k*3+j] - m[j*3+k]) * fRoot;
        out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
    }
    
    return out;
};

/**
* Returns a string representation of a quatenion
*
* @param {quat} vec vector to represent as a string
* @returns {String} string representation of the vector
*/
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.quat = quat;
}
;













  })(shim.exports);
})(this);
/*! jsRocket - v0.0.1 - 2013-03-02
* https://github.com/mog/jsRocket
* Copyright (c) 2013 mog; Licensed MIT*/

var JSRocket={};JSRocket.SyncData=function(){"use strict";function t(t){return e[t]}function n(t){for(var n=0;n<e.length;n++)if(e[n].name===t)return n;return-1}function r(){return e.length}function i(t){var n=new JSRocket.Track;n.name=t,e.push(n)}var e=[];return{getTrack:t,getIndexForName:n,getTrackLength:r,createIndex:i}},JSRocket.Track=function(){"use strict";function o(s){var o=Math.floor(s),a=u(o),f=a.low,l=a.high,c;if(isNaN(f))return NaN;if(isNaN(l)||i[f].interpolation===e)return i[f].value;switch(i[f].interpolation){case t:return c=(s-f)/(l-f),i[f].value+(i[l].value-i[f].value)*c;case n:return c=(s-f)/(l-f),c=c*c*(3-2*c),i[l].value*c+i[f].value*(1-c);case r:return c=Math.pow((s-f)/(l-f),2),i[f].value+(i[l].value-i[f].value)*c}return NaN}function u(e){var t=NaN,n=NaN;for(var r=0;r<s.length;r++)if(s[r]<=e)t=s[r];else if(s[r]>=e){n=s[r];break}return{low:t,high:n}}function a(e,t,n,r){l(e),s.push(e),i[e]={value:t,interpolation:n},r!==!0&&f()}function f(){s=s.sort(function(e,t){return e-t})}function l(e){s.indexOf(e)>-1&&(s.splice(s.indexOf(e),1),delete i[e])}var e=0,t=1,n=2,r=3,i=[],s=[];return{getValue:o,sortIndex:f,add:a,remove:l}},JSRocket.SyncDevicePlayer=function(e){"use strict";function i(e){t=new XMLHttpRequest;if(t===null){r.error();return}t.open("GET",e,!0),t.onreadystatechange=s,t.send()}function s(){t.readyState===4&&(t.status<300?o(t.responseText):r.error())}function o(e){var t,n=0,i,s=0,o,a=(new DOMParser).parseFromString(e,"text/xml"),f=a.getElementsByTagName("tracks"),l=f[0].getElementsByTagName("track");for(n,i=l.length;n<i;n++){var c=u(l[n].getAttribute("name")),h=l[n].getElementsByTagName("key");for(s=0,o=h.length;s<o;s++)t=h[s],c.add(parseInt(t.getAttribute("row"),10),parseFloat(t.getAttribute("value")),parseInt(t.getAttribute("interpolation"),10),!0);c.sortIndex()}r.ready()}function u(e){var t=n.getIndexForName(e);return t>-1?n.getTrack(t):(n.createIndex(e),n.getTrack(n.getTrackLength()-1))}function a(e,t){r[e]=t}function f(){}var t,n=new JSRocket.SyncData,r={ready:function(){},error:function(){}};if(e.rocketXML===""||e.rocketXML===undefined||e.rocketXML===undefined)throw"[jsRocket] rocketXML is not set, try _syncDevice.setConfig({'rocketXML':'url/To/RocketXML.rocket'})";return i(e.rocketXML),{load:i,getTrack:u,update:f,on:a}},JSRocket.SyncDeviceClient=function(e){"use strict";function l(){u.binaryType="arraybuffer",u.send("hello, synctracker!")}function c(e){var r=new Uint8Array(e.data),u=r[0],l,c,h,p;u===104?f.ready():s===u?r[1]===1?f.pause():f.play():i===u?(c=m(r.subarray(1,5)),f.update(c)):t===u?(l=m(r.subarray(1,5)),c=m(r.subarray(5,9)),h=g(r.subarray(9,13)),p=m(r.subarray(13,14)),a.getTrack(l).add(c,h,p),f.update()):n===u?(l=m(r.subarray(1,5)),c=m(r.subarray(5,9)),a.getTrack(l).remove(c),f.update()):o===u&&f.save()}function h(e){console.warn(">> connection closed",e)}function p(e){console.error(">> connection error'd",e)}function d(e){var t=a.getIndexForName(e);return t>-1?a.getTrack(t):(u.send((new Uint8Array([r,0,0,0,e.length])).buffer),u.send(e),a.createIndex(e),a.getTrack(a.getTrackLength()-1))}function v(e){var t=[e>>24&255,e>>16&255,e>>8&255,e&255];u.send((new Uint8Array([i,t[0],t[1],t[2],t[3]])).buffer)}function m(e){var t=0,n=new DataView(new ArrayBuffer(e.length));for(;t<e.length;t++)n.setUint8(t,e[t]);return n.byteLength===1?n.getInt8(0):n.getInt32(0)}function g(e){var t=new DataView(new ArrayBuffer(4));return t.setUint8(0,e[0]),t.setUint8(1,e[1]),t.setUint8(2,e[2]),t.setUint8(3,e[3]),t.getFloat32(0)}function y(e,t){f[e]=t}var t=0,n=1,r=2,i=3,s=4,o=5,u=new WebSocket(e.socketURL),a=new JSRocket.SyncData,f={ready:function(){},update:function(){},play:function(){},pause:function(){},save:function(){}};return u.onopen=l,u.onmessage=c,u.onclose=h,u.onerror=p,{getTrack:d,update:v,on:y}},JSRocket.SyncDevice=function(){"use strict";function s(e){e==="demo"?t=new JSRocket.SyncDevicePlayer(r):t=new JSRocket.SyncDeviceClient(r),t.on("ready",a),t.on("update",f),t.on("play",l),t.on("pause",c)}function o(){return r}function u(e){for(var t in e)e.hasOwnProperty(t)&&(r[t]=e[t]);return r}function a(){e=!0,i.ready()}function f(e){i.update(e)}function l(){i.play()}function c(){i.pause()}function h(n){return e?t.getTrack(n):null}function p(e){Math.floor(e)!==n&&(n=Math.floor(e),t.update(n))}function d(e,t){i[e]=t}var e=!1,t,n,r={socketURL:"ws://localhost:1338",rocketXML:""},i={ready:function(){},update:function(){},play:function(){},pause:function(){}};return{init:s,setConfig:u,getConfig:o,getTrack:h,update:p,on:d}};