import * as THREE from 'three';
import vertexShader from './shaders/surface.vert'
import fragmentShader from './shaders/surface.frag'
import { generateColorPalette, hsl2rgb } from './color';
import * as FXRand from './random.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';

// Feature generation
let features = {
  Palette: FXRand.choice(['BlackWhite']),//, 'Mono', 'Analogous', 'Complementary']),
  Layer: FXRand.bool(0.2) ? 1 : FXRand.int(2, 3)
}

window.$fxhashFeatures = features;

// Canvas
const canvas = document.querySelector('#three-canvas');

// Renderer
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize(4096, 4096, false);

// Generate colors
let colors = generateColorPalette(features);

// Scene
const scene = new THREE.Scene();

// Background
let backgroundColor = hsl2rgb(colors[0][0], colors[0][1], colors[0][2]);
scene.background = new THREE.Color(backgroundColor[0], backgroundColor[1], backgroundColor[2]);

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

// Plane geometry
const planeSize = 512;
const planeSegments = 400;
const geometry = new THREE.PlaneBufferGeometry(planeSize, planeSize, planeSegments, planeSegments);

// Surface color
let surfaceColor = hsl2rgb(colors[1][0], colors[1][1], colors[1][2]);

const layerCount = features.Layer;

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

// Plane mesh
const plane = new THREE.Mesh(geometry, material);

plane.rotateX(-Math.PI / 2.);
plane.position.y = -100;
scene.add(plane);

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

composer.render();

/* COMMENT THIS OUT IF YOU WANT TO SAVE THE IMG
const imgData = renderer.domElement.toDataURL();

const link = document.createElement("a");
link.download = "demo.png";
link.href = imgData;
link.target = "_blank";
link.click();
*/

// Trigger capture
fxpreview();