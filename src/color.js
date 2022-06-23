import * as FXRand from './random.js'

// convert hsl values color to rgb format
/* author: Michael Jackson
   source: https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
   license: | 
    Copyright © 2014 Michael Jackson
    CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE LEGAL SERVICES. DISTRIBUTION OF THIS LICENSE DOES NOT CREATE AN ATTORNEY-CLIENT RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS INFORMATION ON AN "AS-IS" BASIS. CREATIVE COMMONS MAKES NO WARRANTIES REGARDING THE INFORMATION PROVIDED, AND DISCLAIMS LIABILITY FOR DAMAGES RESULTING FROM ITS USE.
    
    THE WORK (AS DEFINED BELOW) IS PROVIDED UNDER THE TERMS OF THIS CREATIVE COMMONS PUBLIC LICENSE ("CCPL" OR "LICENSE"). THE WORK IS PROTECTED BY COPYRIGHT AND/OR OTHER APPLICABLE LAW. ANY USE OF THE WORK OTHER THAN AS AUTHORIZED UNDER THIS LICENSE OR COPYRIGHT LAW IS PROHIBITED.

    BY EXERCISING ANY RIGHTS TO THE WORK PROVIDED HERE, YOU ACCEPT AND AGREE TO BE BOUND BY THE TERMS OF THIS LICENSE. TO THE EXTENT THIS LICENSE MAY BE CONSIDERED TO BE A CONTRACT, THE LICENSOR GRANTS YOU THE RIGHTS CONTAINED HERE IN CONSIDERATION OF YOUR ACCEPTANCE OF SUCH TERMS AND CONDITIONS.       
*/
const hsl2rgb = (h,s,l, a=s*Math.min(l,1-l), f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1)) => [f(0),f(8),f(4)];

const generateColorPalette = (features) => {

    const colorPalette = features.Palette;
    
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
    } else if (colorPalette == 'Complementary') {
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