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
