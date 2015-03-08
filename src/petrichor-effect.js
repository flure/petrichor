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
