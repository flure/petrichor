precision highp float;
attribute vec3 aVertex;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
void main()
{
	vTexCoord = aTexCoord;
	gl_Position = vec4(aVertex, 1.0);
}
