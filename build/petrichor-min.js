/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/
"use strict";window.requestAnimFrame=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){window.setTimeout(a,1e3/60)}}(),window.getMaxWidth=function(){return window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth},window.getMaxHeight=function(){return window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight};var PETRICHOR=function(a){function b(){var b=a.width/a.height,c=window.getMaxWidth(),d=Math.round(window.getMaxWidth()/b),e={width:c,height:d};return e.height=e.width/b,e.height>d&&(e.height=d,e.width=Math.round(e.height*b)),e}function c(){var b,c=0;for(b in a.resources.meshes)a.resources.meshes.hasOwnProperty(b)&&c++;for(b in a.resources.programs)a.resources.programs.hasOwnProperty(b)&&c++;for(b in a.resources.textures)a.resources.textures.hasOwnProperty(b)&&c++;return a.resources.music&&c++,c}return a.width=640,a.height=480,a.gl=null,a.resources={textures:{},programs:{},meshes:{},music:null,loadCounter:0},a.mainCanvas=null,a.fps={frameTimes:[],currentFrame:0,frameStart:(new Date).getTime(),frameEnd:(new Date).getTime()},a.extensions={},a.init=function(c){function d(){var c=b();a.mainCanvas.style.width=c.width+"px",a.mainCanvas.style.height=c.height+"px",a.mainCanvas.style.position="absolute",a.mainCanvas.style.top=Math.round((window.getMaxHeight()-c.height)/2)-1+"px",a.mainCanvas.style.left=Math.round((window.getMaxWidth()-c.width)/2)-1+"px"}function e(b){console.log("Creating canvas..."),a.width=b.width,a.height=b.height,a.mainCanvas=document.createElement("canvas"),a.mainCanvas.id="mainCanvas",a.mainCanvas.style.border="none;",a.mainCanvas.width=a.width,a.mainCanvas.height=a.height,d(),window.onresize=d,document.body.appendChild(a.mainCanvas),console.log("Canvas created.")}function f(){console.log("Creating WebGL context...");try{a.gl=a.mainCanvas.getContext("webgl"),a.gl.viewportWidth=a.mainCanvas.width,a.gl.viewportHeight=a.mainCanvas.height}catch(b){}if(!a.gl)try{a.gl=a.mainCanvas.getContext("experimental-webgl"),a.gl.viewportWidth=a.mainCanvas.width,a.gl.viewportHeight=a.mainCanvas.height}catch(b){}a.gl?console.log("WebGL context created."):window.alert("Could not initialize WebGL, sorry :-(")}e(c),f()},a.setMusic=function(b,c){a.resources.music={ogg:b,mp3:c}},a.addMesh=function(b,c){a.resources.meshes[b]={path:c}},a.addProgram=function(b,c,d){a.resources.programs[b]={vertexPath:c,fragmentPath:d}},a.addTexture=function(b,c,d,e){a.resources.textures[b]={path:c,filter:d,wrap:e}},a.addResources=function(b){var c,d;for(c=0;c<b.length;c++)switch(d=b[c],d.type){case"music":a.setMusic(d.ogg,d.mp3);break;case"mesh":a.addMesh(d.name,d.path);break;case"program":a.addProgram(d.name,d.vertexPath,d.fragmentPath);break;case"texture":a.addTexture(d.name,d.path,d.filter,d.wrap)}},a.loadResources=function(){var b,c;console.log("Loading meshes...");for(b in a.resources.meshes)a.resources.meshes.hasOwnProperty(b)&&(c=a.resources.meshes[b],a.loadMesh(c));console.log("Loading programs...");for(b in a.resources.programs)a.resources.programs.hasOwnProperty(b)&&(c=a.resources.programs[b],a.loadProgram(c));console.log("Loading textures...");for(b in a.resources.textures)a.resources.textures.hasOwnProperty(b)&&(c=a.resources.textures[b],a.loadTexture2D(c));console.log("Loading music..."),a.loadMusic(a.resources.music)},a.isFinishedLoading=function(){return a.resources.loadCounter==c()},a.showFps=function(b){var c,d=0,e=0,f=0;for(a.fps.frameEnd=(new Date).getTime(),e=a.fps.frameEnd-a.fps.frameStart,a.fps.frameStart=a.fps.frameEnd,c=0;c<a.fps.frameTimes.length;c++)f+=a.fps.frameTimes[c];f>=1e3&&(d=(1e3*a.fps.frameTimes.length/f).toFixed(2),document.getElementById(b).innerHTML=""+d+" fps",a.fps.currentFrame=0,a.fps.frameTimes.length=0),a.fps.frameTimes[a.fps.currentFrame++]=e},a.getExtension=function(b){var c,d=["","MOZ_","WEBKIT_"],e=null;if(a.extensions.hasOwnProperty(b))return a.extensions[b];for(c=0;c<d.length&&(e=gl.getExtension(d[c]+b),null==e);c++);return a.extensions[b]=e,e},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.FullscreenQuad=function(b){return this.mesh=new a.Mesh,this.mesh.vertices=[-1,-1,0,1,-1,0,1,1,0,-1,-1,0,1,1,0,-1,1,0],this.mesh.textureCoords=[0,0,1,0,1,1,0,0,1,1,0,1],this.mesh.build(),this.program=new a.Program,b&&(this.program.vertexSrc="precision highp float;\nattribute vec3 aVertex;\nattribute vec2 aTexCoord;\nvarying vec2 vTexCoord;\nvoid main()\n{\n	vTexCoord = aTexCoord;\n	gl_Position = vec4(aVertex, 1.0);\n}",this.program.fragmentSrc="precision highp float;\nuniform sampler2D uTexture;\nvarying vec2 vTexCoord;\nvoid main()\n{\n	gl_FragColor = texture2D(uTexture, vTexCoord);\n}",this.program.build(),this.mesh.setAttributeName("vertex","aVertex"),this.mesh.setAttributeName("uv","aTexCoord")),this.setShaders=function(a,b){this.program.vertexSrc=a,this.program.fragmentSrc=b,this.program.build()},this.render=function(a){var b,c,d=PETRICHOR.gl;if(this.program.enable(),a)for(b=0;b<a.length;b++)c=a[b],this.program.setUniform1i(c.sampler,b),d.activeTexture(d.TEXTURE0+b),d.bindTexture(d.TEXTURE_2D,c.id);this.mesh.render(this.program),this.program.disable()},this},a.createCube=function(){var b=new a.Mesh;return b.vertices=[-1,1,1,-1,-1,1,1,-1,1,-1,1,1,1,-1,1,1,1,1,1,1,-1,1,-1,-1,-1,-1,-1,1,1,-1,-1,-1,-1,-1,1,-1,-1,1,-1,-1,1,1,1,1,1,-1,1,-1,1,1,1,1,1,-1,-1,-1,1,-1,-1,-1,1,-1,-1,-1,-1,1,1,-1,-1,1,-1,1,1,1,1,1,-1,1,1,-1,-1,1,1,1,1,-1,-1,1,1,-1,-1,1,-1,-1,-1,-1,-1,-1,1,-1,1,-1,-1,-1,1,-1,1,1],b.normals=[0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0],b.textureCoords=[0,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,0,1,1,0,1,1],b.build(),b},a.createUvSphere=function(b,c,d){function e(a,c){var d=1/b;f.vertices.push(a[0]),f.vertices.push(a[1]),f.vertices.push(a[2]),f.normals.push(a[0]*d),f.normals.push(a[1]*d),f.normals.push(a[2]*d),f.textureCoords.push(c[0]),f.textureCoords.push(c[1])}var f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w=Math.sin,x=Math.cos,y=Math.PI,z=y/2;for(f=new a.Mesh,f.vertices=[],f.normals=[],f.textureCoords=[],s=-y/(c-1),t=2*y/(d-1),r=0,o=0;d-1>o;o++){for(q=z,v=r+t,p=0;c-1>p;p++)u=q+s,g=[b*x(q)*x(r),b*w(q),b*x(q)*w(r)],k=[(q+z)/y,r/(2*y)],h=[b*x(u)*x(r),b*w(u),b*x(u)*w(r)],l=[(u+z)/y,r/(2*y)],i=[b*x(u)*x(v),b*w(u),b*x(u)*w(v)],m=[(u+z)/y,v/(2*y)],e(g,k),e(h,l),e(i,m),p>0&&c-1>p&&(j=[b*x(q)*x(v),b*w(q),b*x(q)*w(v)],n=[(q+z)/y,v/(2*y)],e(g,k),e(i,m),e(j,n)),q+=s;r+=t}return f.build(),f},a.renderText=function(b,c,d,e,f,g){var h,i=new a.Texture2D,j=null,k=null;for(j=document.createElement("canvas"),j.id="tmpFontCanvas",j.style.border="none;",j.width=b,j.height=b,k=j.getContext("2d"),k.clearRect(0,0,b,b),k.fillStyle=f,k.strokeStyle=g,k.font=e,h=0;h<c.length;h++)k.fillText(c[h],0,d*(h+1)),g&&k.strokeText(c[h],0,d*(h+1));return i.image=j,i.build(),j=null,i},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.Texture2D=function(){var a=PETRICHOR.gl;return this.image=null,this.filter={min:a.LINEAR_MIPMAP_LINEAR,mag:a.LINEAR},this.wrap={s:a.CLAMP_TO_EDGE,t:a.CLAMP_TO_EDGE},this.id=null,this.build=function(){var a=PETRICHOR.gl;return this.id=a.createTexture(),a.bindTexture(a.TEXTURE_2D,this.id),a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,!0),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,a.RGBA,a.UNSIGNED_BYTE,this.image),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,this.filter.min),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,this.filter.mag),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,this.wrap.s),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,this.wrap.t),(this.filter.min==a.LINEAR_MIPMAP_NEAREST||this.filter.min==a.LINEAR_MIPMAP_LINEAR)&&a.generateMipmap(a.TEXTURE_2D),this},this.enable=function(b){return a.activeTexture(a.TEXTURE0+b),a.bindTexture(a.TEXTURE_2D,this.id),this},this.disable=function(){return a.bindTexture(a.TEXTURE_2D,null),this},this},a.loadTexture2D=function(b){function c(a){try{a.build(),PETRICHOR.resources.loadCounter++}catch(b){console.log(b)}}var d=new a.Texture2D;d.image=new Image,b.hasOwnProperty("filter")&&b.filter&&(d.filter=b.filter),b.hasOwnProperty("wrap")&&b.wrap&&(d.wrap=b.wrap),d.image.onload=function(){c(d)},d.image.src=b.path,d.image.complete&&c(d),b.texture=d},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.Program=function(){function b(a,b){var c=PETRICHOR.gl,d=0,e="";if(b){if("vertex"===a)d=c.createShader(c.VERTEX_SHADER);else{if("fragment"!==a)return 0;d=c.createShader(c.FRAGMENT_SHADER)}return c.shaderSource(d,b),c.compileShader(d),c.getShaderParameter(d,c.COMPILE_STATUS)?d:(e=c.getShaderInfoLog(d),e&&(window.alert("Error in the "+a+" shader.\nCheck console to see details."),console.log(e)),null)}}var c=PETRICHOR.gl;return this.id=null,this.vertexId=null,this.fragmentId=null,this.vertexSrc="",this.fragmentSrc="",this.uniforms=new a.Uniforms(this),this.attributes=new a.Attributes(this),this.setSource=function(a,b){this.vertexSrc=a,this.fragmentSrc=b},this.build=function(){var a=PETRICHOR.gl;return this.id=a.createProgram(),this.vertexId=b("vertex",this.vertexSrc),this.fragmentId=b("fragment",this.fragmentSrc),a.attachShader(this.id,this.vertexId),a.attachShader(this.id,this.fragmentId),a.linkProgram(this.id),a.getProgramParameter(this.id,a.LINK_STATUS)||window.alert("Could not initialise shader"),this},this.enable=function(){var a=PETRICHOR.gl;return this.id||this.build(),a.useProgram(this.id),this},this.disable=function(){var a=PETRICHOR.gl;return a.useProgram(null),this},this.setU={mat3:function(){return c.uniformMatrix3fv}(),mat4:function(){return c.uniformMatrix4fv}(),"int":function(){return c.uniform1i}()},this.setUniformMatrix3fv=function(a,b){var c=PETRICHOR.gl,d=this.uniforms.get(a);return d&&-1!==d?void c.uniformMatrix3fv(d,!1,b):this},this.setUniformMatrix4fv=function(a,b){var c=PETRICHOR.gl,d=this.uniforms.get(a);return d&&-1!==d?void c.uniformMatrix4fv(d,!1,b):this},this.setUniform1i=function(a,b){var c=PETRICHOR.gl,d=this.uniforms.get(a);return d&&-1!==d?void c.uniform1i(d,b):this},this.setUniform2fv=function(a,b){var c=PETRICHOR.gl,d=this.uniforms.get(a);return d&&-1!==d?void c.uniform2fv(d,b):this},this.setUniform3fv=function(a,b){var c=PETRICHOR.gl,d=this.uniforms.get(a);return d&&-1!==d?void c.uniform3fv(d,b):this},this.setUniform1f=function(a,b){var c=PETRICHOR.gl,d=this.uniforms.get(a);return d&&-1!==d?void c.uniform1f(d,b):this},this},a.Uniforms=function(a){return this.program=a,this.bindings={},this.get=function(b){var c=PETRICHOR.gl;return this.bindings[b]&&this.bindings.hasOwnProperty(b)&&-1!==this.bindings[b]||(a.enable(),this.bindings[b]=c.getUniformLocation(this.program.id,b)),this.bindings[b]},this},a.Attributes=function(a){return this.program=a,this.bindings={},this.get=function(b){var c=PETRICHOR.gl;return this.bindings[b]&&this.bindings.hasOwnProperty(b)&&-1!==this.bindings[b]||(a.enable(),this.bindings[b]=c.getAttribLocation(this.program.id,b)),this.bindings[b]},this},a.loadProgram=function(b){function c(a){return console.log("finalizeProgramLoad"),a.program.fragmentSrc&&a.program.vertexSrc?(a.program.build(),void PETRICHOR.resources.loadCounter++):void setTimeout(function(){c(a)},50)}function d(a,b,c){switch(c){case"fragment":a.program.fragmentSrc=b.responseText;break;case"vertex":a.program.vertexSrc=b.responseText}}var e=b.vertexPath,f=b.fragmentPath,g=new XMLHttpRequest,h=new XMLHttpRequest;b.program=new a.Program,g.open("GET",e),g.overrideMimeType("text/plain"),g.onreadystatechange=function(a,b){return function(){4==b.readyState&&d(a,b,"vertex")}}(b,g),h.open("GET",f),h.overrideMimeType("text/plain"),h.onreadystatechange=function(a,b){return function(){4==b.readyState&&d(a,b,"fragment")}}(b,h),g.send(),h.send(),c(b)},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.loadMusic=function(a){var b=!1,c=!1;if(console.log("Loading music..."),a){if(!a.ogg&&!a.mp3)return void console.log("No path for music.");a.audio=new Audio,c=!(!a.audio.canPlayType||!a.audio.canPlayType("audio/mpeg;").replace(/no/,"")),b=!(!a.audio.canPlayType||!a.audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/,"")),a.hasOwnProperty("mp3")&&c?(a.audio.src=a.mp3,console.log("Music loaded: MP3 format.")):a.hasOwnProperty("ogg")&&b?(a.audio.src=a.ogg,console.log("Music loaded: OGG format.")):console.log("Music not loaded: unsupported format."),PETRICHOR.resources.loadCounter++}},a.playMusic=function(){PETRICHOR.resources.music.audio.play()},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.Mesh=function(b,c){return this.vertices=null,this.normals=null,this.textureCoords=null,this.indices=null,this.transform=new a.Transform,this.textures=[],this.isDynamic=b||!1,this.vertexBuffer=null,this.normalBuffer=null,this.textureCoordsBuffer=null,this.indexBuffer=null,this.attributeNames={},c&&this.set(c),this.set=function(a){return a.hasOwnProperty("vertices")&&(this.vertices=new Float32Array(a.vertices)),a.hasOwnProperty("normals")&&(this.normals=new Float32Array(a.normals)),a.hasOwnProperty("uv")&&(this.textureCoords=new Float32Array(a.uv)),a.hasOwnProperty("indices")&&(this.indices=new Uint16Array(a.indices)),this},this.build=function(){var a=PETRICHOR.gl;return this.vertexBuffer=a.createBuffer(),a.bindBuffer(a.ARRAY_BUFFER,this.vertexBuffer),a.bufferData(a.ARRAY_BUFFER,new Float32Array(this.vertices),this.isDynamic?a.DYNAMIC_DRAW:a.STATIC_DRAW),this.vertexBuffer.itemSize=3,this.vertexBuffer.itemCount=this.vertices.length/3,this.normals&&(this.normalBuffer=a.createBuffer(),a.bindBuffer(a.ARRAY_BUFFER,this.normalBuffer),a.bufferData(a.ARRAY_BUFFER,new Float32Array(this.normals),this.isDynamic?a.DYNAMIC_DRAW:a.STATIC_DRAW),this.normalBuffer.itemSize=3,this.normalBuffer.itemCount=this.normals.length/3),this.textureCoords&&(this.textureCoordsBuffer=a.createBuffer(),a.bindBuffer(a.ARRAY_BUFFER,this.textureCoordsBuffer),a.bufferData(a.ARRAY_BUFFER,new Float32Array(this.textureCoords),this.isDynamic?a.DYNAMIC_DRAW:a.STATIC_DRAW),this.textureCoordsBuffer.itemSize=2,this.textureCoordsBuffer.itemCount=this.textureCoords.length/2),this.indices&&(this.indexBuffer=a.createBuffer(),a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,this.indexBuffer),a.bufferData(a.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.indices),this.isDynamic?a.DYNAMIC_DRAW:a.STATIC_DRAW),this.indexBuffer.itemSize=1,this.indexBuffer.itemCount=this.indices.length),this},this.render=function(a,b){var c,d,e=PETRICHOR.gl,f=-1,g=-1,h=-1;a.enable(),b&&b.upload(a,this.transform);try{for(c=0;c<this.textures.length;c++)d=this.textures[c],d.texture.enable(d.unit),a.setUniform1i(d.sampler,d.unit)}catch(i){console.log(i)}return this.attributeNames.hasOwnProperty("vertex")&&(f=a.attributes.get(this.attributeNames.vertex)),this.attributeNames.hasOwnProperty("normal")&&(g=a.attributes.get(this.attributeNames.normal)),this.attributeNames.hasOwnProperty("uv")&&(h=a.attributes.get(this.attributeNames.uv)),e.enableVertexAttribArray(f),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.vertexAttribPointer(f,this.vertexBuffer.itemSize,e.FLOAT,!1,0,0),this.attributeNames.hasOwnProperty("normal")&&(e.enableVertexAttribArray(g),e.bindBuffer(e.ARRAY_BUFFER,this.normalBuffer),e.vertexAttribPointer(g,this.normalBuffer.itemSize,e.FLOAT,!1,0,0)),this.attributeNames.hasOwnProperty("uv")&&(e.enableVertexAttribArray(h),e.bindBuffer(e.ARRAY_BUFFER,this.textureCoordsBuffer),e.vertexAttribPointer(h,this.textureCoordsBuffer.itemSize,e.FLOAT,!1,0,0)),this.indices?(e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.indexBuffer),e.drawElements(e.TRIANGLES,this.indexBuffer.itemCount,e.UNSIGNED_SHORT,0)):e.drawArrays(e.TRIANGLES,0,this.vertices.length/3),this},this.setAttributeName=function(a,b){return this.attributeNames[a]=b,this},this.setTexture=function(a,b,c){var d={unit:a,texture:b,sampler:c};return this.textures.push(d),this},this},a.Transform=function(){return this.translation=vec3.create(),this.rotation=vec3.create(),this.scale=vec3.fromValues(1,1,1),this.transformMatrix=mat4.create(),this.dirty=!1,this.setTranslation=function(a,b,c){return this.translation[0]=a,this.translation[1]=b,this.translation[2]=c,this.dirty=!0,this},this.setRotation=function(a,b,c){return this.rotation[0]=a,this.rotation[1]=b,this.rotation[2]=c,this.dirty=!0,this},this.setScale=function(a,b,c){return this.scale[0]=a,this.scale[1]=b,this.scale[2]=c,this.dirty=!0,this},this.getTransformationMatrix=function(){var a=mat4.create(),b=mat4.create(),c=mat4.create();return this.dirty?(mat4.identity(b),mat4.rotateX(b,b,this.rotation[0]),mat4.rotateY(b,b,this.rotation[1]),mat4.rotateZ(b,b,this.rotation[2]),mat4.translate(a,a,this.translation),mat4.scale(c,c,this.scale),mat4.identity(this.transformMatrix),mat4.multiply(this.transformMatrix,this.transformMatrix,c),mat4.multiply(this.transformMatrix,this.transformMatrix,a),mat4.multiply(this.transformMatrix,this.transformMatrix,b),this.dirty=!1,this.transformMatrix):this.transformMatrix},this},a.loadMesh=function(b){function c(b,c){var d=JSON.parse(c.responseText);b.mesh=new a.Mesh,b.mesh.set(d),b.mesh.isDynamic=d.isDynamic,b.mesh.build(),PETRICHOR.resources.loadCounter++}var d=new XMLHttpRequest;d.open("GET",b.path),d.overrideMimeType("text/plain"),d.onreadystatechange=function(a,b){return function(){4==b.readyState&&c(a,b)}}(b,d),d.send()},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.Light=function(){return this.color=vec3.fromValues(1,1,1),this.position=vec3.fromValues(0,0,0),this.radius=2,this.power=1,this.uniforms={color:"",position:"",radius:"",power:""},this.setUniforms=function(a){return a.hasOwnProperty("color")&&a.color&&(this.uniforms.color=a.color),a.hasOwnProperty("position")&&a.position&&(this.uniforms.position=a.position),a.hasOwnProperty("radius")&&a.radius&&(this.uniforms.radius=a.radius),a.hasOwnProperty("power")&&a.power&&(this.uniforms.power=a.power),this},this.uploadParams=function(a){this.uniforms.color&&a.setUniform3fv(this.uniforms.color,this.color),this.uniforms.position&&a.setUniform3fv(this.uniforms.position,this.position),this.uniforms.radius&&a.setUniform1f(this.uniforms.radius,this.radius),this.uniforms.power&&a.setUniform1f(this.uniforms.power,this.power)},this},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.Fbo=function(b,c){return this.frameBuffer=null,this.colorBuffer=null,this.depthBuffer=null,this.width=b,this.height=c,this.build=function(b){var c=PETRICHOR.gl;if(this.frameBuffer=c.createFramebuffer(),c.bindFramebuffer(c.FRAMEBUFFER,this.frameBuffer),c.getError()!=c.NO_ERROR&&alert("Error in gl.bindFramebuffer"),this.colorBuffer=c.createTexture(),c.bindTexture(c.TEXTURE_2D,this.colorBuffer),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_MAG_FILTER,c.LINEAR),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_MIN_FILTER,c.LINEAR),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_WRAP_S,c.CLAMP_TO_EDGE),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_WRAP_T,c.CLAMP_TO_EDGE),c.texImage2D(c.TEXTURE_2D,0,c.RGB,this.width,this.height,0,c.RGB,c.UNSIGNED_BYTE,null),c.getError()!=c.NO_ERROR&&alert("Error in creating the fbo color buffer"),b){var d=a.getExtension("WEBGL_depth_texture");if(null==d)return void alert("WEBGL_depth_texture extension required.\nPlease switch to a modern browser.");this.depthBuffer=c.createTexture(),c.bindTexture(c.TEXTURE_2D,this.depthBuffer),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_MAG_FILTER,c.LINEAR),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_MIN_FILTER,c.LINEAR),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_WRAP_S,c.CLAMP_TO_EDGE),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_WRAP_T,c.CLAMP_TO_EDGE),c.texImage2D(c.TEXTURE_2D,0,c.DEPTH_COMPONENT,this.width,this.height,0,c.DEPTH_COMPONENT,c.UNSIGNED_SHORT,null),c.getError()!=c.NO_ERROR&&alert("Error in creating the fbo depth buffer")}else this.depthBuffer=c.createRenderbuffer(),c.bindRenderbuffer(c.RENDERBUFFER,this.depthBuffer),c.getError()!=c.NO_ERROR&&alert("Error in gl.bindRenderbuffer"),c.renderbufferStorage(c.RENDERBUFFER,c.DEPTH_COMPONENT16,this.width,this.height);c.getError()!=c.NO_ERROR&&alert("Error in gl.renderbufferStorage"),c.framebufferTexture2D(c.FRAMEBUFFER,c.COLOR_ATTACHMENT0,c.TEXTURE_2D,this.colorBuffer,0),c.getError()!=c.NO_ERROR&&alert("Error attaching color buffer"),b?c.framebufferTexture2D(c.FRAMEBUFFER,c.DEPTH_ATTACHMENT,c.TEXTURE_2D,this.depthBuffer,0):c.framebufferRenderbuffer(c.FRAMEBUFFER,c.DEPTH_ATTACHMENT,c.RENDERBUFFER,this.depthBuffer),c.getError()!=c.NO_ERROR&&alert("Error attaching depth buffer"),c.checkFramebufferStatus(c.FRAMEBUFFER)!=c.FRAMEBUFFER_COMPLETE&&alert("Error in FBO creation"),c.bindTexture(c.TEXTURE_2D,null),c.bindRenderbuffer(c.RENDERBUFFER,null),c.bindFramebuffer(c.FRAMEBUFFER,null)},this.begin=function(){var a=PETRICHOR.gl;a.bindFramebuffer(a.FRAMEBUFFER,this.frameBuffer),a.getError()!=a.NO_ERROR&&alert("Error in Fbo.begin")},this.end=function(){var a=PETRICHOR.gl;a.bindFramebuffer(a.FRAMEBUFFER,null),a.getError()!=a.NO_ERROR&&alert("Error in Fbo.end")},this},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.Effect=function(a,b,c,d,e,f){return this.name=a,this.initCallback=b,this.updateCallback=c,this.startTime=e,this.endTime=f,this.loop=d,this.init=function(){console.log('Initializing effect "'+this.name+'"...'),this.initCallback()},this.update=function(a){this.updateCallback(a)},this},a.effects=[],a.addEffect=function(b){a.effects.push(b)},a.time=0,a.initEffects=function(){var b=0,c=null;for(b=0;b<a.effects.length;b++)c=a.effects[b],c.init();a.time=(new Date).getTime()},a.playEffects=function(){var b=0,c=(new Date).getTime()-a.time,d=null;for(b=0;b<a.effects.length;b++)d=a.effects[b],(d.loop||d.startTime<=c&&d.endTime>=c)&&d.update(c)},a.start=function(){a.initEffects(),a.play()},a.play=function(){document.getElementById("chkFps").checked?PETRICHOR.showFps("fps"):document.getElementById("fps").innerHTML="",window.requestAnimFrame(a.play),a.playEffects()},a}(PETRICHOR||{}),PETRICHOR=function(a){return a.Camera=function(){return this.matrixUniforms={},this.fovy=45,this.near=.1,this.far=2,this.ratio=4/3,this.position=[0,0,3],this.center=[0,0,0],this.up=[0,1,0],this.projectionMatrix=mat4.create(),this.viewMatrix=mat4.create(),this.setPerspective=function(){return mat4.perspective(this.projectionMatrix,this.fovy,this.ratio,this.near,this.far),this},this.setOrthographic=function(a,b,c,d){return mat4.ortho(this.projectionMatrix,a,b,c,d,this.near,this.far),this},this.lookAt=function(){return mat4.lookAt(this.viewMatrix,this.position,this.center,this.up),this},this.setUniform=function(a,b){return this.matrixUniforms[a]=b,this},this.upload=function(a,b){var c=b.getTransformationMatrix(),d=mat4.create(),e=mat3.create();mat4.multiply(d,this.projectionMatrix,this.viewMatrix),mat4.multiply(d,d,c),mat3.normalFromMat4(e,c),a.setUniformMatrix3fv(this.matrixUniforms.normalMatrix,e),a.setUniformMatrix4fv(this.matrixUniforms.modelMatrix,c),a.setUniformMatrix4fv(this.matrixUniforms.projectionMatrix,this.projectionMatrix),a.setUniformMatrix4fv(this.matrixUniforms.viewMatrix,this.viewMatrix),a.setUniformMatrix4fv(this.matrixUniforms.mvpMatrix,d),a.setUniform1f(this.matrixUniforms.near,this.near),a.setUniform1f(this.matrixUniforms.far,this.far)},this},a}(PETRICHOR||{});