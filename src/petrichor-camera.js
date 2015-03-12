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
