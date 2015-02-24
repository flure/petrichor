precision highp float;

varying vec2 vTexCoord;

uniform sampler2D uDepthTex;
uniform sampler2D uColorTex;
uniform vec2 uTextureSize;
uniform float uThreshHold;

float dx = 1.0 / uTextureSize.x;
float dy = 1.0 / uTextureSize.y;

float sobel(vec2 texel) {
	float t00 = texture2D(uDepthTex, vTexCoord + vec2(-dx, -dy)).r;
	float t10 = texture2D(uDepthTex, vTexCoord + vec2(0.0, -dy)).r;
	float t20 = texture2D(uDepthTex, vTexCoord + vec2(dx, -dy)).r;
	float t01 = texture2D(uDepthTex, vTexCoord + vec2(-dx, 0.0)).r;
	float t11 = texture2D(uDepthTex, vTexCoord + vec2(0.0, 0.0)).r;
	float t21 = texture2D(uDepthTex, vTexCoord + vec2(dx, 0.0)).r;
	float t02 = texture2D(uDepthTex, vTexCoord + vec2(-dx, dy)).r;
	float t12 = texture2D(uDepthTex, vTexCoord + vec2(0.0, dy)).r;
	float t22 = texture2D(uDepthTex, vTexCoord + vec2(dx, dy)).r;

	float Gx = -t00 - 2.0 * t10 - t20 + t02 + 2.0 * t12 + t22;
	float Gy = -t00 - 2.0 * t01 - t02 + t20 + 2.0 * t21 + t22;
	float c = sqrt(Gx * Gx + Gy * Gy);
	if(c >= uThreshHold) c = 1.0; else c = 0.0;
	return 1.0 - c;
}

void main(void) {
	// float c = sobel(vTexCoord + vec2(-dx, -dy)) +
	// 					sobel(vTexCoord + vec2(dx, -dy)) +
	// 					sobel(vTexCoord + vec2(-dx, dy)) +
	// 					sobel(vTexCoord + vec2(dx, dy));
	// c /= 4.0;
	float c = sobel(vTexCoord);	

	gl_FragColor = c * texture2D(uColorTex, vTexCoord);
}
