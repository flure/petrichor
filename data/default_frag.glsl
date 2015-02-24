precision highp float;

uniform sampler2D uDiffuseTex;

// Le padding est nécessaire : pour certains navigateurs, les structs sont
// alignées sur l'équivalent d'un vec4 (4 floats)
struct LightInfo {
	vec3 position;
	float pad0; // padding
	vec3 color;
	float radius;
};
#define MAX_LIGHTS 8

uniform LightInfo uLights[MAX_LIGHTS];
uniform int uNbLights;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec4 vPosition;

vec3 light_contribution(LightInfo light, vec3 normal) {
	vec3 light_dir = normalize(light.position - vPosition.xyz);
	float light_dist = length(light_dir);
 	float ndotl = dot(normal, light_dir);
	float illum = max(0.0, ndotl);

	// float att = 1.0 - max(1.0, min(0.0, light_dist / light.radius));

	// illum *= att;
	
	if(illum <= 0.5) illum = 0.5;
	else illum = 1.0;

	return illum * light.color;
}

void main(void) {
	vec3 normal = normalize(vNormal);
	vec3 lighting = vec3(0.0);
	for(int i = 0; i < MAX_LIGHTS; i++) {
		if(i >= uNbLights) break;
		lighting = lighting + light_contribution(uLights[i], normal);
	}
	vec4 diffuse = texture2D(uDiffuseTex, vTexCoord);
	gl_FragColor = vec4(lighting, 1.0) * diffuse;
}
