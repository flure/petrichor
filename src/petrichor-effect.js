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

	/**
	 * The list of effects for this demo.
	 */
	my.effects = [];

	/**
	 * Add an effect fx to the list.
	 */
	my.addEffect = function(fx) {
		my.effects.push(fx);
	};
	my.time = 0;

	/**
	 * Initializes all the effects by calling their init() function.
	 */
	my.initEffects = function() {
		var i = 0,
			fx = null;

		for (i = 0; i < my.effects.length; i++) {
			fx = my.effects[i];
			fx.init();
		}
		my.time = new Date().getTime();
	};

	/**
	 * Plays the effects, taking into account the current time and the timing info
	 * of each effect. Ordering the effects when adding them is important for 
	 * effects which timings overlap.
	 */
	my.playEffects = function() {
		var i = 0,
			time = new Date().getTime() - my.time,
			fx = null;

		for (i = 0; i < my.effects.length; i++) {
			fx = my.effects[i];
			if((fx.startTime <= time) && (fx.loop || (fx.endTime >= time))) {
				fx.update(time);
			}
		}
	};

	/**
	 * Stats the demo by initializing all the effects and then playing them.
	 */
	my.start = function() {
		my.initEffects();
		my.play();
	};

	/**
	 * Plays all the effects in order.
	 */
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
