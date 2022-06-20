# Generative terrain NFTs for fxhash, in threejs
In this tutorial, we will create a surface/terrain generator and make it into a [fxhash](https://www.fxhash.xyz/) compatible generative NFT. We will use fBm and Perlin noise to generate the terrain by modifying a simple plane's vertex positions, and we will accomplish this by writing a custom shader with lighting in threejs. Then we will explore how we can generate an infinite amount of variations, and then I'll show how you can generate different color palettes for the artwork. 

In recent months fxhash and generative NFTs got really popular among the generative art community, so the aim of this tutorial is to encourage everyone to give a try to the platform. The whole project operates on the tezos blockchain, so as you may know, uploading / creating (or collecting) fees are basically costs nothing, the NFTs are [clean](https://medium.com/tqtezos/clean-nfts-on-tezos-58566b2fdba1), and fxhash is open for everyone. And as you will see, it isn't that difficult to create a nice little project. 

## Prerequisites
Some prerequisites for the tutorial: the basics of javascript obviously, and a bit of experience with npm, git, threejs, fxhash, NFTs, shaders, and glsl would not hurt (especially with the basics of shaders), but I'm trying to explain everything in detail. There are a lot of introductory articles and tutorials linked to the relevant parts, so I'm sure almost everyone can follow along.

If you don't know what is fxhash, generative token or NFTs (altough I'm pretty sure you've heard about NFTs...), just browse through their [official docs](https://www.fxhash.xyz/doc). They did a wonderful job explaining everything you need to know. Start [here](https://www.fxhash.xyz/doc/artist/guide-publish-generative-token) :).  
If you're not familiar with threejs, then start with the [threejs fundamentals](https://threejs.org/manual/#en/fundamentals).  
If you're not familiar with shaders, and how they work, then read this wonderful online book - [The Book of Shaders](https://thebookofshaders.com/). Understanding the first few chapters would be enough.

Now buckle up because this is going to be a long one!

## Preparation
Make sure you have node installed on your machine, because we will use webpack and npm as well in this tutorial. If you don't know what webpack, node, and npm are, read the first few paragraphs of [this](https://www.freecodecamp.org/news/what-is-npm-a-node-package-manager-tutorial-for-beginners/), and [this](https://www.freecodecamp.org/news/an-intro-to-webpack-what-it-is-and-how-to-use-it-8304ecdc3c60/) article.

If this is already done, then first, open a terminal, clone the fx-hash webpack boilerplate and install the required packages. This boilerplate is a really good starting point to make a project for fxhash. Let's call our project terrestrial, because to me, it looks like surfaces of other (perhaps abandoned) terrestrial planets.
```sh
$ git clone https://github.com/fxhash/fxhash-webpack-boilerplate.git terrestrial && cd terrestrial
$ npm install
```

If you aren't familiar with the boilerplate, I suggest you read through the `README.md` first. There is a helpful description of the details, e.g. how you can run, build and upload the project to fxhash, what the snippets do, etc. There are a few key things that we should keep in my mind when we are making a project for fxhash, but the most important is that we have to ensure that our code will always generate the same output when the same input (the hash data of the mint) is given to it. Therefore, as the README states, it is discouraged to use random functions (like `Math.random()`) in the code. Instead, the fxhash template provides a hash function for this (called `fxrand()`), which uses the input hash as a seed for generating random numbers. So whenever we want to inject randomness (and chaos!) into our code, we will use that function. More on this later, but try to keep in mind this information throughout this tutorial, because it's really important.

Now install threejs as well.
```sh
$ npm install --save three
```

Okay, let's prepare our project first. 
Head over to the `index.html` file inside the `./public` folder, and rename the title of our project in the title tag.

```html
...
  <head>
    <title>terrestrial</title>
    <meta charset="utf-8">
...
```
Insert our three canvas inside the body tag.
```html
<body>
    <canvas id="three-canvas"></canvas>
    <!-- WEBPACK will inject the bundle.js here -->
</body>
```
As you can see in the comments in the `index.html` file, don't modify anything else.

Edit the `package.json`. You can rename the project, add a description, change the author, license, version, etc. These things are not necessary by the way, but I like to keep everything tidy.

```json
{
  "name": "terrestrial",
  "version": "1.0.0",
  "description": "terrestrial planet slices",
  "main": "index.js",
  "author": "Daniel Petho",
  "license": "MIT",
//...
```

Next, open `styles.css`, delete the boilerplate, and copy the following lines.
We define the body as a flex container, and justify and align everything to the center inside it. The only element inside the body is our three-canvas. Let's set its max-width and height to 100%. These rules ensure that our canvas will always have an aspect ratio of 1:1, and always will be at the center. 

```css
body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: black;
  }
 
#three-canvas {
    max-width: 100%;
    max-height: 100%;
}
```

## Let's code!

Now open the `index.js` inside the `./src` folder. We don't need anything from it, so delete everything, and let's write some JS code!

Let's import the `THREE` module, then create our canvas, our renderer, and our scene.
Set the renderer's size to 4096x4096. It doesn't matter that it's bigger than our display size, since the css rules ensure it will always fit the screen. You can increase this to work on larger screens as well, but keep in mind that increasing the resolution could result in a much longer render time as well. I think this is enough, because this size works reasonably well in print (if you want a physical copy for yourself 😉). 

```javascript
import * as THREE from 'three';

// Canvas
const canvas = document.querySelector('#three-canvas');

// Renderer
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize(4096, 4096, false);
```

Add the scene, and for now, set the background color to light gray. We will take care of the colors later on.
```javascript
// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
```

Now create our camera, set its position, and ensure that it looks to the center of our scene. Let's use an orthographic camera, since in my opinion, an isometric look will fit this concept better. 

```javascript
// Camera
const near = 0.1;
const far = 1000;
const width = 1024;
const height = 1024;
const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, near, far);

// Camera position
camera.position.x = 256;
camera.position.y = 512;
camera.position.z = 256;

// Look at the center
camera.lookAt(new THREE.Vector3(0, 0, 0));
```

Add an `OrbitControl` as well, so we can move around in our scene. We only need this for debugging, and to see what's happening. We are not going to use it in our final code, but more on that later.

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

//...

// OrbitControl
const controls = new OrbitControls(camera, renderer.domElement);
```

Let's add our plane next. First, we have to define how many segments the plane's geometry should have. The more segments we have, the more detail we get on the surface. However, we have to pay attention to older devices and to mobile devices as well. Let's set the plane segments to 400 for now. This will result in 16 000 vertices on the plane overall, which will provide more than enough detail, and it can render on a mobile device within a reasonable timeframe.

```javascript
// Plane geometry
const planeSize = 512;
const planeSegments = 400;
const geometry = new THREE.PlaneBufferGeometry(planeSize, planeSize, planeSegments, planeSegments);
```

For the material, use a Lambert shader for now, just to see that everything is in its place.

```javascript
// Plane material
const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color(0x333333)
});
```

Now combine the geometry and the material into a Three mesh. Rotate it along the X axis by -90 degrees, so we get a look at our terrain's side. Then position a bit under the center, to ensure it is still at the center of the frame, even if the terrain is a bit high. Then, add it to the scene.

```javascript
// Plane mesh
const plane = new THREE.Mesh(geometry, material);

plane.rotateX(-Math.PI / 2.);
plane.position.y = -100;
scene.add(plane);
```

Finally, add our render loop.

```javascript
// Render loop
const render = () => {

  // Control update
  controls.update();

  // Render
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
} 

render();
```

Let's see what we got so far. You can run the code with the following command in the terminal:

```sh
$ npm run start
```

![plain black plain](https://i.imgur.com/ta7fAYn.png)

Our plane is plain black, since our scene doesn't have any lights to interact with the geometry. We don't need any lights for this project anyway, because we will write our custom basic lighting shader later on. So far this was pretty boring, so let's start writing our shader!

## Shader preparation
There are multiple ways to use custom shaders in threejs. I like the approach when you write them in separate files, and load those files when you need them. For this, we need a loader, which can convert our glsl text files readable by our javascript code and threejs. My choice for this is the raw-loader module.

Open the terminal again, and install the package with npm.
```sh
$ npm install raw-loader
```
We need to tell webpack that when it sees a file with an extension of `.vert` `.frag`, `.glsl` etc., it should use the raw-loader module to load it. For this, open the `webpack.config.js` file under the `./config` folder, and place the following snippet (noted with a comment) to the rules list under the `module` property.

The file should look like this now:
```javascript
const path = require("path")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "bundle.js",
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },

      // Loading shaders -- COPY THIS
      {
        test: /\.(glsl|vs|fs|vert|frag)$/i, 
        exclude: /node_modules/, 
        use: 'raw-loader',
      }
      // end :)
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      inject: "body",
      publicPath: "./"
    })
  ]
}
```

Okay, now make a new folder under`./src` called `shaders`, and create two new files, one for the vertex shader and one for the fragment shader. Let's call them `surface.vert` and `surface.frag`. 

Before we write the actual code which produces the terrain with the lighting, make sure that everything is working by writing a simple shader.

Vertex shader:
```glsl
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
}
```

In the fragment shader, output a purplish color.
```glsl
void main() {
    gl_FragColor = vec4( 0.5, 0., 1., 1. );
}
```


Load these two shaders into the `index.js` file, change the plane's `LambertMaterial` to `ShaderMaterial`, and pass the two shader text file to it.

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import vertexShader from './shaders/surface.vert'
import fragmentShader from './shaders/surface.frag'

//...

// Plane material
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
});
```

This should color our plane to a lovely purplish color. This is what we have so far:

![purple plain](https://i.imgur.com/yeMe940.png)


## Custom shader - fBm
Okay, still pretty boring, so let's spice it up finally! 
Let's start with the vertex shader first. As I mentioned at the beginning of the tutorial we will use `fBm` (fractal Brownian motion) noise to modify the plane's vertex positions. I don't know exactly where `fBm` is originated from, but I'm pretty sure it became a really popular technique thanks to [Patricio Gonzalez Vivo](http://patriciogonzalezvivo.com/) & [Jen Lowe](https://www.jenlowe.net/) (authors of The Book of Shaders), and thanks to [Inigo Quilez](https://iquilezles.org/). I won't even try to explain it, because compared to their explanations, I would do a pretty poor job. So if you're not familiar how this technique works, I recommend to read through the [10th](https://thebookofshaders.com/10/), [11th](https://thebookofshaders.com/11/), and [13th](https://thebookofshaders.com/13/) chapter of the famous "The Book of Shaders" book. 

Moreover, if you have a bit of time, and a passion for math (which of course you have!), watch [this video](https://www.youtube.com/watch?v=BFld4EBO2RE&t=772s) by Inigo (IQ). It's just magical. I mean everything he does is, but this video is simply mind-blowing. The visualization at the beginning is exceptionally helpful to understand what's happening, and how this technique could help us to make interesting surfaces.

So, if you already know how to do it, or read through the chapters, you know that the `fBm` function basically just a noise function applied over and over again. So, to construct an `fBm` function, we need a noise function. Moreover, that noise function needs a random function that generates random numbers. Again, read [this chapter](https://thebookofshaders.com/10/) of the book if you're confused. 
Okay, but to be more specific, let's call this random number generator function a hash function, because it outputs the same value whenever when we feed the same input to it. It's the same concept as our project: we have to get the same output on the same input, every damn time! 

The hash function used in the book is the following:

```glsl
float hash( in vec2 _st ) {
    return fract( sin( dot( _st.xy,
                         vec2( 12.9898,78.233 ) ) ) * 43758.5453123 );
}
```

This is a pretty common function in the shader community. If you're googling for a glsl random/hash function, this is the one you find most of the time. However, there is a problem with this, namely, this function is utilizing a sine function to generate the values. There are multiple reasons why this is not a good practice. For us, the main problem with it is that the implementation of the sin function varies between different GPUs, so you may get different values on different machines. You can read more at this stackoverflow [question](https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner). Check the accepted answer :).   
If you want to dive deeper, check out [this](https://www.shadertoy.com/view/4djSRW), and [this](https://stackoverflow.com/questions/12828800/interview-hash-function-sine-function).

Okay, but what does this mean in the context of our code? For example, if we run this code on a new M1 Mac device, and on a machine that has an integrated graphics card, we get a different look on both of them, even when we feed the same input hash to our program. And remember, we have to make sure, that our code outputs exactly the same result on the same input, so a minter/buyer sees the same artwork on different devices.

For this reason, we cannot use this hash function. Therefore we need a machine/driver/platform independent technique to feed randomness to the noise function. There are a few ways to do this, one of them could be to generate random values on the CPU with the help of the `fxrand()` function, then upload those values as a texture to the GPU. However, we're going to use a much quicker way, namely integer hashes. Fortunately, there are quite a few to choose from, thanks to the wonderful community, but we will copy one from [here](https://www.shadertoy.com/view/4tXyWN), written by the great wizard, IQ :).

So let's rewrite our vertex shader, starting with the integer hash function:

```glsl
precision highp int;

float hash( uvec2 x )
{
    uvec2 q = 1103515245U * ( ( x>>1U ) ^ ( x.yx ) );
    uint  n = 1103515245U * ( ( q.x   ) ^ ( q.y>>3U ) );
    return float( n ) * ( 1.0 / float( 0xffffffffU ) );
}
```

The only downside of this method is that it uses bitwise operations, which supported only by WebGL2. It's possible that our code will not work with older browsers or machines. Fortunately, more and more browsers/platforms provide support for WebGL2, so this should be only a minor issue.

Then, we need our noise function (copied from [here](https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83)):

```glsl
float noise( vec2 p ){
    uvec2 ip = uvec2( floor( p ) );
    vec2 u = fract( p );
    u = u * u * ( 3.0 - 2.0 * u );
	
    float res = mix(
		mix( hash( ip ), hash( ip + uvec2( 1, 0 ) ), u.x ),
		mix( hash( ip + uvec2( 0, 1 ) ), hash( ip + uvec2( 1,1 ) ), u.x ), u.y );
    return res * res;
}
```

And the fBm noise function. In the book, the octave, lacunarity, and gain variables are predefined, but we will use them as parameters, and we will experiment with the right combinations, but more on that later.
```glsl
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
```

You can find the proper attribution for these snippets in the final code on [GitHub](https://github.com/danielpetho/terrestrial-tutorial).

Okay, let's rewrite our main function. We use the fBm function to create our terrain, by modifying the z coordinate of the plane. Let's just use some arbitrary number for the noise parameters (octave, frequency, gain, lacunarity) for now. 

```glsl
void main() {
    vec3 p = position; //just for convinience reasons
    float f = fBm( uv * 3., 3, 4., 0.3 );
    p.z = f * 100.;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1. );
}
```

Now if we run the code, we can notice that something's happened.
![almost a terrain](https://i.imgur.com/wAHC4mQ.png)

It should look like a terrain, but we can't see anything actually, because our fragment shader still outputs only one color. We have to illuminate our surface to be able to decode what's on the image! Normally, threejs could take care of all the lighting stuff, but since we're writing a fully custom shader, we have to do this by ourselves now.

## Custom shader - basic lighing 💡
So let's write a simple, basic lighting shader. We will use a very simplified model, with a directional light only. If you're not familiar with the basic lighting techniques, read [this article](https://learnopengl.com/Lighting/Basic-Lighting), because we are going to use exactly the same method (in the article, it's called diffuse lighting). Moreover, rewatch the above-mentioned [video](https://www.youtube.com/watch?v=BFld4EBO2RE&t=389s) by IQ, because in the "Key Lighting" section he explains and visualizes the concept beautifully.
Okay, as the article/video says, we need two crucial information pieces to implement lighting, one of them is the normal vectors of the surface, and another one is the direction of the light. Let's start with the normal vector.

A normal vector is a vector that is perpendicular to the surface at a given point. As you can see, the direction of the normal vector is different at every point of the surface, so we need to calculate them at every point/vertex. 

![surface normals](https://i.imgur.com/xdd2y7s.png)
*[source](https://en.wikipedia.org/wiki/Normal_(geometry)#/media/File:Surface_normals.svg)*

Okay, but how do we get these vectors? Since we're modifying every vertices in the vertex shader, we have to calculate them ourselves. The best solution would be to calculate the derivates (in respect to x and y) of the fBm function, because that gives us the two tangents at a given point, and the cross product of those two tangents gives the normal vector. However - to be honest - I didn't dive deep into the math of how to do this. The `fBm` function is already too complex, and on top of that, we will apply this function multiple times in the next section. But hey, here is an [article](https://iquilezles.org/articles/morenoise/) by IQ, if you want to take the hard route. 

We are going to use a different method. We will utilize the `dFdx()` and `dFdy()` functions in the fragment shader. As the khronos [documentation](https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/dFdx.xhtml) says, these two functions return the approximations to the derivatives of their arguments (the argument of both functions is a point on the surface - where we want to calculate the normal).  
These approximations are more than enough for us, because we are not aiming a super-realistic look anyway. Okay, so these two derivates actually the two tangents of the surface at a given point, and the cross-product of these two tangents returns the normal vector.

![tangents and normal](https://i.imgur.com/8bWVqiU.png)
*[source](https://commons.wikimedia.org/wiki/File:Vertex_tangent,_bitangent_and_normal_vector.svg)*

Unfortunately, these two functions are only available in the fragment shader, so we have to calculate the normals there. Note that this could be much more inefficient compared to the formerly mentioned solution: in our solution, the GPU has to calculate the normals for EVERY point on the surface, but if we did this in the vertex shader, the GPU would have to calculate them per-vertex, which results in less computation (okay, to be more specific, this depends on how much vertices we use for the mesh, and how much fragments outputs the shader, but generally this is the case...)

Okay, for our solution, we need to pass the vertex positions from the vertex shader to the fragment shader, and we need them in view/eye space. If you don't know what view and eye space are, check out [this article](https://learnopengl.com/Getting-started/Coordinate-Systems).

```glsl
precision highp int;

varying vec3 vVertex;

//...

void main() {
  vec3 p = position;
  float f = fBm( uv * 4., 3, 4., 0.2 );
  p.z = f * 100.;

  // passing the vertex positions in eye space
  vVertex = ( modelViewMatrix * vec4( p, 1. ) ).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1. );
}
```

Now open the `surface.frag` file, and copy the following code. It's noted with a comment where we calculate the normal vector. After that, we just give an arbitrary direction of the light, normalize it, then calculate the dot product of that vector and the normal vector. The dot product could be a negative number, which doesn't make sense when we're talking about colors, so let's use a handy expression with the `max()` function to avoid negative numbers. Lastly, multiply the result with a color, and for now, just use the already defined purplish color.

```glsl
varying vec3 vVertex;

void main()
{
    // calculcate the normal vectors
    vec3 N = normalize( cross( dFdx( vVertex ), dFdy( vVertex ) ) );

    // arbitrary direction of the light
    const vec3 lightDir = vec3( 1., 0., -1. );

    // normalize that as well
    vec3 L = normalize( lightDir );

    //------------- our purple color ------ no negative numbers ---
    vec3 diffuse = vec3( 0.5, 0.0, 1.0 ) * max( dot( N, -L ), 0.0 );

    gl_FragColor = vec4( diffuse, 1.0 );
}
```

And now we have this. Much better, right?
![terrain with one noise layer](https://i.imgur.com/7aA7xMR.jpg)

## Custom shader - fBm #2

Okay, let's make this more terrain-ish. For this, we can experiment with the fBm function parameters. For example, increasing the octave adds finer details to the terrain. Of course we will do that as well, but on top of that, we are going to spice this up by adding another layer of `fBm` noise. If we do this multiple times, we can get a lot of interesting and unexpected results. This technique is called domain warping, and it is from IQ (again :)). See [this article](https://iquilezles.org/articles/warp/).

So, let's add another layer of fBm noise in the vertex shader.

```glsl
f = fBm( vec2( uv.x * f, uv.y * f ) * 3.9 + vec2( 92.4, 0.221 ), 2, 1.1, 1.9 );
```
![terrain with two noise layer](https://i.imgur.com/qVoTVgZ.jpg)


And another one:

```glsl
f = fBm( vec2( uv.x * f, uv.y * f ) * 1.3 + vec2( 1.4, 3.221 ), 3, 2.2, 1.1 );
```
![terrain with three noise layer](https://i.imgur.com/vwQ35Cc.jpg)

Okay, this is much better. Let's make this terrain look like a slice of a planet, by leaving the edges of the plane unaffected by the fBm noise. We can achieve this with an if statement. Our main function looks like this at this point:

```glsl
void main() {
    vec3 p = position;

    if ( p.x < 256. && p.x > -256. && p.y < 256. && p.y > -256. ) {
        float f = fBm( uv * 4., 3, 4., 0.2 );
        f = fBm( vec2( uv.x * f, uv.y * f ) * 3.9 + vec2( 92.4, 0.221 ), 2, 1.1, 1.9 );
        f = fBm( vec2( uv.x * f, uv.y * f ) * 1.3 + vec2( 1.4, 3.221 ), 3, 2.2, 1.1 );

        p.z = f * 100.;
    }

     vVertex = ( modelViewMatrix * vec4( p, 1. )).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1. );
}
```

And the result:
![terrain slice](https://i.imgur.com/jKwA1Wj.jpg)

Aaaaalright, pretty neat, huh? Now to make this into an interesting NFT project, we should introduce some randomness into the system, so everyone who will mint our token should get a different, interesting variation. For this, we will change the hard-coded parameters (noise octave, frequency, gain, lacunarity, the number of noise layers, height, and color) to randomly generated variables. We will generate these values on the CPU, and upload them to the GPU by using uniforms. 

## Randomness
As I mentioned earlier, whenever we introduce randomness into our code, we have to use the `fxrand()` function. The `fxrand()` function returns values between 0 and 1, however, sometimes we need values larger than 1, sometimes integer values, and sometimes we need to select a value randomly from a list. For these tasks, I usually like to use some convenience functions, built upon the `fxrand()` function. Let's create a new file for this, call it `random.js`, and copy the code below. I hope the comments are self-explanatory.

```javascript
// random number between a and b (b is not included)
const num = (a, b) => {
    return a + (b - a) * fxrand();
}

// random integer between a and b (b is included)
// requires a < b
const int = (a, b) => {
  return Math.floor(num(a, b + 1));
}

// random boolean with p as percent likelihood of true
const bool = (p) => {
  return fxrand() < p;
}

// choose a random item in an array of items
const choice = (list) => {
  return list[int(0, list.length - 1)];
}

export { num, int, bool, choice };
```

(Disclaimer: These four functions were inspired by someone else's code, and I don't remember if I found it on the internet, or in a random discord group, but if you know who is the original author, please let me know so that I can give proper credit.) 

Okay, these functions will come in handy in the following steps, so let's move on!

## Generative colors 🌈🌈
I swear, finding the colors is the most difficult part sometimes, it's an art and science on its own. Personally, I like the approach when you select your favorite color palettes, organize them into a list, and pick one randomly to paint your artwork. There are an awful lot of handy tools online to generate color palettes, if you can't come up with your own. 

However, we will use another approach in this tutorial - we will generate our own color palettes. This is a really great [video](https://www.youtube.com/watch?v=p6SkfMIREHA&list=PLroLjS4HDi0BLMx3d7mzROMfm7bC9ZQuc&index=4) (by the great people at [Futur](https://thefutur.com/)), on how to come up with color palettes that rock! Actually, if you want to dive deep, they have a [playlist](https://www.youtube.com/watch?v=QkCVrNoqcBU&list=PLroLjS4HDi0BLMx3d7mzROMfm7bC9ZQuc) about color theory. They are short, and they contain (almost) everything you need to know. But at least, watch the first mentioned video, because we will use exactly the same technique to generate our lovely colors.

Basically, because we are using only two colors in this tutorial - one for the background, and one for our surface - it's going to be quite easy. We will use HSL (Hue, Saturation, Lightness) encoding. We have four categories altogether:
- Mono color palette - we use only one color (to be more precise, only one hue) both for the background and for the surface as well, but with different lightness and saturation. For example, our background could be dark blue, and our surface could be light blue.
- Complementary - we pick a random hue value, and by moving on the color wheel 30-60 degrees we pick another one. eg: Violet background, blue-violet surface.
- Analogous - we pick one hue, and the other one opposite to it. eg: Violet background, yellow surface.
- Black and white - this tutorial is made for generativehut, which as you noticed follows a black and white approach. In honor of this, our fourth category is a black and white palette. Here the hues don't matter, because we are using fully unsaturated colors. Only the lightness matters.

![color theory](https://i.imgur.com/9N2S7Lp.png)

Okay, I hope the theory is clear, let's implement it in our code. Create a new file under `./src` called `color.js`.
The hue value can range from 0 to 360, the saturation and the lightness from 0 to 100. There are two other noticeable things in this code.
- One of them is the hsl2rgb function. We need this function to convert colors from HSL color space into RGB, because we need them in that format in our shader, and we will convert them before we pass these values to the GPU. 
- The other one is noted with the following comment - increasing contrast. Well, that's the aim of those lines, to increase the contrast between the two colors. It could feel too much or too dull, when the two colors have the same saturation and brightness, even if the hue is not the same. 

```javascript
import * as FXRand from './random.js'

// convert hsl values color to rgb format
// source: https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
const hsl2rgb = (h,s,l, a=s*Math.min(l,1-l), f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1)) => [f(0),f(8),f(4)];


const generateColorPalette = () => {

    // define our three different color palette category
    const paletteList = ['Black&White', 'Mono', 'Analogous', 'Complementary'];

    // choose one randomly
    const colorPalette = FXRand.choice(paletteList); 

    // random chance
    const r = FXRand.bool(0.5);

    // INCREASING CONTRAST
    // if r true, then the background is going to be darker and less saturated, 
    // and the surface more brighter and colorful. If r is false, it supposed to be the other way around.
    let saturation1 = r ? FXRand.num(0.4, 0.6) : FXRand.num(0.6, 0.95);
    let lightness1 = r ? FXRand.num(0.1, 0.55) : FXRand.num(0.6, 0.95);

    let saturation2 = r ? FXRand.num(0.7, 1.0) : FXRand.num(0.4, 0.7);
    let lightness2 = r ? FXRand.num(0.55, 0.9) : FXRand.num(0.35, 0.55);

    // pick a random hue on the color wheel
    let hue1 = FXRand.num(0, 360);
    let hue2;

    if (colorPalette == 'Mono') {   
        // if we have a Mono color palette, then the hues are the same
        hue2 = hue1;
  
    } else if (colorPalette == 'Analogous') {
        hue2 = hue1;
        // if we have Analogous palette, we need to pick another hue next to the original one
        // either by decreasing or increasing the angle on the wheel
        hue2 += FXRand.bool(0.5) ? FXRand.num(-60, -30) : FXRand.num(30, 60);
    } else (colorPalette == 'Complementary') {
        hue2 = hue1;

        // if we have a Complementary palette, we need the opposite value on the color wheel
        hue2 += 180;
    } else {
        // if we have a Black and White color palette, hue doesn't matter, and the saturation should be zero
        hue1 = 0;
        hue2 = 0;
        saturation1 = 0;
        saturation2 = 0;

        lightness1 = r ? 0.05 : 0.9;
        lightness2 = r ? 0.95 : 0.5;
    }

    const color1 = [hue1, saturation1, lightness1];
    const color2 = [hue2, saturation2, lightness2];

    return [color1, color2];
}

export { generateColorPalette, hsl2rgb };
```

Now open the `index.js` file, and import our newly created color functions. Then call the `generateColors()` function to generate our two colors. Assign the first one to the background color after converting to RGB value. Next, pass the second color to the fragment shader as a uniform. 

```javascript
//...
import { generateColorPalette, hsl2rgb } from './color';

//...

// Generate colors
let colors = generateColorPalette();

// Background
let backgroundColor = hsl2rgb(colors[0][0], colors[0][1], colors[0][2]);
scene.background = new THREE.Color(backgroundColor[0], backgroundColor[1], backgroundColor[2]);

//...

// Surface color
let surfaceColor = hsl2rgb(colors[1][0], colors[1][1], colors[1][2]);

// Our shader uniforms
const uniforms = {
  uColor: { value: new THREE.Vector3(surfaceColor[0], surfaceColor[1], surfaceColor[2]) },
}

// Plane material
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
});
```

Lastly, edit our fragment shader by changing our previously defined purplish color to the value passed as a uniform.
```glsl
uniform vec3 uColor;

varying vec3 vVertex;

void main()
{
    // calculcate the normal vectors
    vec3 N = normalize( cross( dFdx( vVertex ), dFdy( vVertex ) ) );

    // arbitrary direction of the light
    const vec3 lightDir = vec3( 1., 0., -1. );

    vec3 L = normalize( lightDir );
    vec3 diffuse = uColor * max( dot( N, -L ), 0.0 );

    gl_FragColor = vec4( diffuse, 1.0 );
}
```
Now refresh our code, and voilá! We have some colors, finally! 
And if we did everything right, we get a different color palette after every refresh. It's not perfect, some color combos are not really aligned with my taste, but hey, it does the job. Here are a few results.  
  
![color variations of the terrain](https://i.imgur.com/6mbflxa.jpg)

Okay, now move on to the noise parameters.

## Noise parameters
The process is the same as the color. We generate a bunch of random values for our surface with our recently written random functions, then we pass them to the vertex shader as uniforms. We are using two boolean uniforms to tell the vertex shader if we want to use one, two, or three fBm layer. Then we specify vector uniforms for the noise and fBm parameters. I'm using three-component vectors, the x coordinate is reserved for the first noise layer, the y for the second one, and z for the third one. We need a height uniform as well, to control how high our surface should be. And let's add some more variation by offsetting the noise with a random value.

This step requires a bit of experimentation, as you will see. There is a lot of combination which looks unpleasant, for example, choosing too high values or too low values are just messing up the visual. But this is the most exciting part, I've spent multiple hours experimenting, refreshing the page, and just looking at the unexpected results. 
After a lot of (wasted?) hours, I've come up with these unnecessarily complicated rules for choosing the noise values.

```javascript
//...
import * as FXRand from './random.js' // import our random helpers to index.js as well.

//...

const layerCount = FXRand.bool(0.2) ? 1 : FXRand.int(2, 3);

const generateParams = () => {
  let uNoiseFrequency, uOctaves, uLacunarity, uGain, uHeight, uSecondLayer, uThirdLayer;

  if (layerCount == 1) {

    uNoiseFrequency = {value: new THREE.Vector3(FXRand.num(2.5, 10.0), 0., 0.) };
    uOctaves = { value: new THREE.Vector3(FXRand.int(2, 8), 0, 0) };
    uLacunarity = { value: new THREE.Vector3(uNoiseFrequency.value.x < 5 ? FXRand.num(4., 6.) : FXRand.num(2., 4.), 0., 0.) };
    uGain = { value: new THREE.Vector3(uLacunarity.value.x > 8. ? FXRand.num(0.03, 0.1) : FXRand.num(0.05, 0.3), 0., 0.) };

    uSecondLayer = { value: false };
    uThirdLayer = { value: false };
    
    uHeight = { value: FXRand.num(150, 300) };

  } else if (layerCount == 2) {

    let variant = FXRand.int(1, 3);

    if (variant == 1)
    {
      let x = FXRand.num(0.5, 2.);
      uNoiseFrequency = {value: new THREE.Vector3(x, FXRand.num(10., 15.), 0.) };
      uOctaves = { value: new THREE.Vector3(FXRand.int(2, 6), FXRand.int(2, 6), 0) };
      uLacunarity = { value: new THREE.Vector3(FXRand.num(4., 16.), uNoiseFrequency.value.x < 1.5 ? FXRand.num(4., 6.) : FXRand.num(0., 4.), 0.) };
      uGain = { value: new THREE.Vector3(uLacunarity.value.x > 8. ? FXRand.num(0.05, 0.1) : FXRand.num(0.1, 0.2), uLacunarity.value.y > 2. ? FXRand.num(0.1, 0.2) : FXRand.num(0.2, 0.5), 0.) };
    }

    else if ( variant == 2) {
      let x = FXRand.num(2., 10.);
      uNoiseFrequency = {value: new THREE.Vector3(x, FXRand.num(1., 7.), 0.) };
      uOctaves = { value: new THREE.Vector3(FXRand.int(2, 6), FXRand.int(3, 6), 0) };
      uLacunarity = { value: new THREE.Vector3(FXRand.num(4., 16.), uNoiseFrequency.value.x < 4.5 ? FXRand.num(4., 8.) : FXRand.num(0., 4.), 0.) };
      uGain = { value: new THREE.Vector3(uLacunarity.value.x > 8. ? FXRand.num(0.05, 0.1) : FXRand.num(0.1, 0.2), uLacunarity.value.y > 2. ? FXRand.num(0.1, 0.2) : FXRand.num(0.2, 0.5), 0.) };
    } else {
      let x = FXRand.num(1., 4.);
      uNoiseFrequency = {value: new THREE.Vector3(x, FXRand.num(5., 15.), 0.) };
      uOctaves = { value: new THREE.Vector3(FXRand.int(2, 6), FXRand.int(3, 7), 0) };
      uLacunarity = { value: new THREE.Vector3(FXRand.num(4., 16.), uNoiseFrequency.value.x < 1. ? FXRand.num(5., 10.) : FXRand.num(2., 5.), 0.) };
      uGain = { value: new THREE.Vector3(uLacunarity.value.x > 5. ? FXRand.num(0.05, 0.1) : FXRand.num(0.1, 0.2), uLacunarity.value.y > 2. ? FXRand.num(0.1, 0.2) : FXRand.num(0.2, 0.5), 0.) };
    }

    uSecondLayer = { value: true };
    uThirdLayer = { value: false };

    uHeight = { value: FXRand.num(100, 350) };

  } else {
      let x = FXRand.num(3.0, 6.);
      let y = FXRand.num(3.0, 7.);

      uNoiseFrequency = {value: new THREE.Vector3(x, y, y > 5. ? FXRand.num(2., 3.) : FXRand.num(3., 5.) ) };
      uOctaves = { value: new THREE.Vector3(FXRand.int(3, 5), FXRand.int(3, 5), FXRand.int(3, 5) ) };
      uLacunarity = { value: new THREE.Vector3(uNoiseFrequency.value.x < 2.5 ? FXRand.num(4., 5.) : FXRand.num(2., 4.), uNoiseFrequency.value.x < 2.5 ? FXRand.num(3., 5.) : FXRand.num(1., 3.), FXRand.num(2., 10.)) };
      uGain = { value: new THREE.Vector3(uLacunarity.value.x > 4. ? FXRand.num(0.05, 0.1) : FXRand.num(0.1, 0.2), uLacunarity.value.y > 4. ? FXRand.num(0.15, 0.2) : FXRand.num(0.1, 0.4), uLacunarity.value.z > 4. ? FXRand.num(0.1, 0.2) : uNoiseFrequency.value.z > 5. ? FXRand.num(0.1, 0.15) : FXRand.num(0.2, 0.5)) };

      uSecondLayer = { value: true };
      uThirdLayer = { value: true };

      uHeight = { value: FXRand.num(200, 350) };
  }
  return { uNoiseFrequency, uOctaves, uLacunarity, uGain, uHeight, uSecondLayer, uThirdLayer };
}

const params = generateParams();

//...
```

Now that we generated all these numbers on the CPU, pass them to the GPU as uniforms:

```javascript
// Our shader uniforms
const uniforms = {
  uNoiseFrequency: params.uNoiseFrequency,
  uOctaves: params.uOctaves,
  uLacunarity: params.uLacunarity,
  uGain: params.uGain,
  uSecondLayer: params.uSecondLayer,
  uThirdLayer: params.uThirdLayer,
  uHeight: params.uHeight,
  uResolution: { value: new THREE.Vector2(planeSegments, planeSegments)},
  uRandOffset: { value: FXRand.num(0, 512) },
  uColor: { value: new THREE.Vector3(surfaceColor[0], surfaceColor[1], surfaceColor[2]) },
}

// Plane material
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
});
```

Next we have to modify the vertex shader to use the uniforms. 

```glsl
uniform bool uSecondLayer;
uniform bool uThirdLayer;

uniform vec3 uNoiseFrequency;
uniform ivec3 uOctaves;
uniform vec3 uLacunarity;
uniform vec3 uGain;
uniform float uHeight;
uniform float uRandOffset;

varying vec3 vVertex;

//...

float noise( vec2 p ) {

    // offset our random function for more variation
    p += uRandOffset;

    uvec2 ip = uvec2( floor( p ) );
    vec2 u = fract( p );
    u = u * u * ( 3.0 - 2.0 * u );
	
    float res = mix(
		mix( hash( ip ), hash( ip + uvec2( 1, 0 ) ), u.x ),
		mix( hash( ip + uvec2( 0, 1 ) ), hash( ip + uvec2( 1, 1 ) ), u.x ), u.y );
    return res * res;
}

//...

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
```

Aaand here are some results:

![generative surfaces](https://i.imgur.com/P9ZcXoZ.jpg)

## Post-processing

Okay, as a final touch, add some post-processing. The artwork has some jagged lines here and there, which I don't really like, so blur our image first. Then add the super-secret sauce, some noise effect to the end result. 

Using post-processing in threejs is really easy. We just have to use the `EffectComposer`, which was specially designed to apply post-processing effects in threejs. First, we have to import all the necessary effects and files from the examples directory. We need also a `ShaderPass`, a vertical and horizontal blur shader for the blurring. Then we have to create an `EffectComposer`, and a `Pass` for each effect. One for the horizontal, one for the vertical blur, and one for the film effect. Lastly, we have to change our `renderer.render(scene, camera)` function in the render loop to `composer.render()`.
Read more [here](https://threejs.org/docs/#manual/en/introduction/How-to-use-post-processing), if you're interested.
```javascript
// ...
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';

// ...

// Post process
// Effect composer
const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);  // THIS IS IMPORTANT btw. 
                              // A lot of devices have different pixel ratio, 
                              // which could result inconsistent result across devices. 
                              // Set it to 1.  
// Render Pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Horizontal blur with a ShaderPass
const hblurPass = new ShaderPass(HorizontalBlurShader);
hblurPass.uniforms.h.value = 1 / 4096; // we just need a slight blur, not much:)
composer.addPass(hblurPass);

// Vertical blur with a ShaderPass
const vblurPass = new ShaderPass(VerticalBlurShader);
vblurPass.uniforms.v.value = 1 / 4096;
composer.addPass(vblurPass);

// The secret sauce with a slight noise
const effectFilm = new FilmPass(0.15, 0.025, 0, false);
composer.addPass(effectFilm );

// Render loop
const render = () => {

  // Control update
  controls.update();

  // Render
  // renderer.render(scene, camera); <- DELETE THIS
  composer.render();
  
  window.requestAnimationFrame(render);
} 

render();
```

Okaay, we're almost done. Let's clean the code. Because this artwork is quite heavy on an average computer, we do not want to enable interactivity on the piece. For this, delete the `OrbitControl`, because we do not need it anymore. Then modify our render function. Instead of the `requestAnimationFrame()` loop, call the `composer.render()` function only once.
```javascript
// ...
// Render loop
// DELETE THESE LINES 
/*const render = () => {

  // Control update
  controls.update();

  // Render
  composer.render();
  
  window.requestAnimationFrame(render);
} 

render();*/

// CALL ONLY THIS
composer.render();
```

## Features and preview
When we upload a project to fxhash, the site will capture a preview of our artwork, so even the interactive pieces could have 'thumbnails'. At upload, we can choose that fxhash should capture our canvas after x seconds, or, we can choose to trigger this capture module programmatically. For the latter one, there is a function provided by fxhash, called `fxpreview()`. We want to trigger this after our terrain is fully rendered, so let's call this function at the end of our code.

```javascript

// ...
composer.render()

// Trigger capture
fxpreview();
```

Okay, let's check how we can implement features for our project. Read the Features section of the [fxhash doc](https://www.fxhash.xyz/doc/artist/guide-publish-generative-token#features) if you're not familiar what features are exactly. In short, features are handy if you want to play with rarities in your NFT. Let's suppose there is a feature of you work, eg. a golden color palette, which will occur in every 500th generation. The generail idea behind the concept that this "rare" NFT could worth much more than the other part of the collection.
I'm not going to put much emphasis on this, let's just see a simple example of it, and you can customize this as you wish. Let's use the color palette and the number of layers as features. (Obviously, these will not make any difference, because the distribution of these features is even, so based on them, you cannot decide which NFTs are rare and which aren't).

Let's generate the features right after the imports.
```javascript
//...

// Feature generation
let features = {
  Palette: FXRand.choice(['Black&White', 'Mono', 'Analogous', 'Complementary']),
  Layer: FXRand.bool(0.2) ? 1 : FXRand.int(2, 3)
}

window.$fxhashFeatures = features;
//...
```

Then, we just have to modify the `generateColorPalette()` and `generateParams()` functions to use these features. Open the `colors.js` file, and add a parameter to the function, and use the `Palette` property of that parameter as the chosen color palette.

```javascript
// ...
const generateColorPalette = (features) => {

  const colorPalette = features.Palette;
  
  // random chance
  const r = FXRand.bool(0.5);

  // ...
```

Then, modify the function in the `index.js` file as well by passing the generated features. After this, modify the `layerCount` line as well.
```javascript
// ...

// Colors
let colors = generateColorPalette(features);

// ...

// Shader uniforms
const layerCount = features.Layer;

// ...
```

## Uploading to fxhash
The last thing is to upload the project to fxhash. Open a terminal, and run the following command.
```sh
$ npm run build
```
This will generate a compressed file called `project.zip` under the `./dist-zipped` folder. 
We didn't do this throughout the tutorial, but it's important to frequently test your application in the sandbox environment. It helps to notice mistakes early on. 
Uploading the project is pretty straightforward, we just have to go to the "mint a generative token" section, and upload the generated zip file. Then we can select the thumbnail for the project, then there are some customizable settings for the capture module (we have to select the "fxpreview trigger" option). Lastly, we have to add the name, description, price, royalties on secondary sales, edition number, etc. You can find everything you need to know on the [fxhash doc](https://www.fxhash.xyz/doc) (under "the artistic guides" section).

That's it friends, I really hope it was useful! The project is released under this [link](). 256 edition, for 5 tezos. 90% of the proceedings (including secondary shares/royalties) go to [this](https://tzkt.io/KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx/) donation contract, which was setup by the fxhash and the [Versum](https://versum.xyz/) team. This contract splits the received funds between different charities ([Save The Children](https://thegivingblock.com/donate/save-the-children/), [Direct Relief](https://thegivingblock.com/donate/direct-relief/), etc.). You can read more on the contract [here](https://github.com/teia-community/teia-docs/wiki/Ukranian-Fundraising). If you want to support a good cause, mint one for yourself!:)

You can find the code on [GitHub](https://github.com/danielpetho/terrestrial-tutorial).
If you have any questions, feedback, etc, just drop a message (and a follow!) on twitter [@nonzeroexitcode](https://twitter.com/nonzeroexitcode).

Have a nice day and see you in the next one! 🌞