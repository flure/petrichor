attribute vec3 aVertex;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

struct Matrices {
	mat4 model;
	mat4 view;
	mat4 projection;
	mat4 MVP; // projectionMatrix * viewMatrix * modelMatrix
	mat3 normal;
};

uniform Matrices uMatrices;
uniform float uNear;
uniform float uFar;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec4 vPosition;

void main()
{
    vPosition = uMatrices.model * vec4(aVertex, 1.0);
    vNormal = uMatrices.normal * aNormal;
    vTexCoord = aTexCoord;

    gl_Position = uMatrices.MVP *  vec4(aVertex, 1.0);
}
