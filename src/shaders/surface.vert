precision highp int;

uniform bool uSecondLayer;
uniform bool uThirdLayer;

uniform vec3 uNoiseFrequency;
uniform ivec3 uOctaves;
uniform vec3 uLacunarity;
uniform vec3 uGain;
uniform float uHeight;
uniform float uRandOffset;

varying vec3 vVertex;

/* author: Inigo Quilez
   source: https://www.shadertoy.com/view/4tXyWN
   license: | 
    Copyright © 2017 Inigo Quilez
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
*/
float hash( uvec2 x )
{
    uvec2 q = 1103515245U * ( ( x>>1U ) ^ ( x.yx ) );
    uint  n = 1103515245U * ( ( q.x   ) ^ ( q.y>>3U ) );
    return float( n ) * ( 1.0 / float( 0xffffffffU ) );
}

/* author: Morgan McGuire @morgan3d, http://graphicscodex.com
   source: https://www.shadertoy.com/view/4dS3Wd
   license: |
   Copyright @ 2014 Morgan McGuire
    Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met: 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
float noise( vec2 p )
{
    // offset our random function for more variation
    p += uRandOffset;

    uvec2 ip = uvec2( floor( p ) );
    vec2 u = fract( p );
    u = u * u * ( 3.0 - 2.0 * u );
	
    float res = mix(
		mix( hash( ip ), hash( ip + uvec2( 1, 0 ) ), u.x ),
		mix( hash( ip + uvec2( 0, 1 ) ), hash( ip + uvec2( 1,1 ) ), u.x ), u.y );
    return res * res;
}

float fBm( vec2 p, int octaves, float lacunarity, float gain ) {
    float freq = 1.0;
    float amp = 0.5;
    float sum = 0.;
    for( int i = 0; i < octaves; i++ ) {
        sum += noise( p * freq ) * amp;
        freq *= lacunarity;
        amp *= gain;
    }
    return sum;
}

void main() {
    vec3 p = position;

    if ( p.x < 256. && p.x > -256. && p.y < 256. && p.y > -256. ) {
      float f = fBm( uv * uNoiseFrequency.x, uOctaves.x, uLacunarity.x, uGain.x );

      if ( uSecondLayer )
		    f = fBm( vec2( uv.x * f, uv.y * f ) * uNoiseFrequency.y  + vec2( 92.4, 0.221 ), uOctaves.y, uLacunarity.y, uGain.y );

      if ( uThirdLayer )
        f = fBm( vec2( uv.x * f, uv.y * f ) * uNoiseFrequency.z + vec2( 1.4, 3.221 ), uOctaves.z, uLacunarity.z, uGain.z );

        p.z = f * uHeight;
    }

    vVertex = ( modelViewMatrix * vec4( p, 1. ) ).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1. );
}