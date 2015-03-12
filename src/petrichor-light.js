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
