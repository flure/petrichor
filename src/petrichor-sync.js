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
