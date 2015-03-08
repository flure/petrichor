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
