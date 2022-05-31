import * as FXRand from './random.js'

// convert hsl values color to rgb format
// source: https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
const hsl2rgb = (h,s,l, a=s*Math.min(l,1-l), f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1)) => [f(0),f(8),f(4)];

const generateColorPalette = (features) => {

    const colorPalette = features.Palette;
    
    // random chance
    const r = FXRand.bool(0.5);

    // INCREASING CONTRAST
    // if r true, then the background is going to be darker and less saturated, 
    // and the surface more brighter and colorful. If r is false, it supposed to be the other way around.
    const saturation1 = r ? FXRand.num(0.4, 0.6) : FXRand.num(0.6, 0.95);
    const lightness1 = r ? FXRand.num(0.1, 0.55) : FXRand.num(0.6, 0.95);

    const saturation2 = r ? FXRand.num(0.7, 1.0) : FXRand.num(0.4, 0.7);
    const lightness2 = r ? FXRand.num(0.55, 0.9) : FXRand.num(0.35, 0.55);

    // pick a random hue on the color wheel
    const hue1 = FXRand.num(0, 360);
    let hue2;

    if (colorPalette == 'Mono') {   
        // if we have a Mono color palette, then the hues are the same
        hue2 = hue1;
  
    } else if (colorPalette == 'Analogous') {
        hue2 = hue1;
        // if we have Analogous palette, we need to pick another hue next to the original one
        // either by decreasing or increasing the angle on the wheel
        hue2 += FXRand.bool(0.5) ? FXRand.num(-60, -30) : FXRand.num(30, 60);
    } else {
        hue2 = hue1;

        // if we have a Complimentary palette, we need the opposite value on the color wheel
        hue2 += 180;
    }

    const color1 = [hue1, saturation1, lightness1];
    const color2 = [hue2, saturation2, lightness2];

    return [color1, color2];
}

export { generateColorPalette, hsl2rgb };