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
