/*
Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

/*jshint globalstrict: true*/
'use strict';

var PETRICHOR = (function(my) {

	my.renderText = function (textureSize, textLines, textHeight, fontStyle, fillColor, strikeColor) {
		var texture = new my.Texture2D(),
			canvas = null,
			context = null, i,
			textHeight, metrics;

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

    for(i = 0; i < textLines.length; i++) {
    	context.fillText(textLines[i], 0, textHeight * (i+1));
    	if(strikeColor) {
    	 	context.strokeText(textLines[i], 0, textHeight * (i+1));
    	}
  	}

  	texture.image = canvas;
  	texture.build();

    canvas = null;
    return texture;
	};

  return my;
}(PETRICHOR || {}));
