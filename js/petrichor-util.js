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

	my.FullscreenQuad = function (useDefaultShader) {
		// Create the mesh
		this.mesh = new my.Mesh();
		this.mesh.vertices = new Float32Array([-1.0, -1.0, 0.0,  // DL
																					 1.0, -1.0, 0.0,	 // DR
																					 1.0, 1.0, 0.0,		 // UR
																					 -1.0, -1.0, 0.0,  // DL
																					 1.0, 1.0, 0.0,		 // UR	
																					 -1.0, 1.0, 0.0]); // UL

		this.mesh.textureCoords = new Float32Array([0.0, 0.0,		// DL
																								1.0, 0.0,		// DR
																								1.0, 1.0,		// UR
																								0.0, 0.0,		// DL
																								1.0, 1.0,		// UR
																								0.0, 1.0]); // UL
		this.mesh.build();

		// Create the program for rendering this mesh
		this.program = new my.Program();
		if(useDefaultShader) {
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

    this.render = function (textures) {
    	var gl = PETRICHOR.gl, i, tex;
    	this.program.enable();
    	if(textures) {
	    	for(i = 0; i < textures.length; i++) {
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

	return my;
}(PETRICHOR || {}));
