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
     * Loads a music from a resource object describing it.
     * @param  {object} resource The object describing the music. It must have
     * the following properties:
     * 	- path: the path to the music file.
     * The object is then modified to contain an Audio object named 'audio'
     * representing the loaded music.
     */
    my.loadMusic = function(resource) {
        var oggSupport = false, mp3Support = false;
        console.log('Loading music...');
        if (!resource) {
            return;
        }
        if ((!resource.ogg) && (!resource.mp3)) {
            console.log('No path for music.');
            return;
        }
        resource.audio = new Audio();
        mp3Support = !!(resource.audio.canPlayType && 
                        resource.audio.canPlayType('audio/mpeg;')
                            .replace(/no/, ''));
        oggSupport = !!(resource.audio.canPlayType && 
                        resource.audio.canPlayType('audio/ogg; codecs="vorbis"')
                            .replace(/no/, ''));
        if(resource.hasOwnProperty('mp3') && mp3Support) {
            resource.audio.src = resource.mp3;
            console.log('Music loaded: MP3 format.');
        } else if(resource.hasOwnProperty('ogg') && oggSupport) {
            resource.audio.src = resource.ogg;
            console.log('Music loaded: OGG format.');
        } else {
            console.log('Music not loaded: unsupported format.')
        }
        
        PETRICHOR.resources.loadCounter++;
    };

    /**
     * Starts the playing of the music.
     */
    my.playMusic = function() {
        PETRICHOR.resources.music.audio.play();
    };

    return my;
}(PETRICHOR || {}));
