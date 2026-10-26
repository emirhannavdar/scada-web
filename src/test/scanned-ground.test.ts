import {describe,it,expect} from 'vitest';
import {Texture,SRGBColorSpace,NoColorSpace,RepeatWrapping} from 'three';
import {configureGroundTexture} from '@/lib/flight/scanned-ground';
describe('scanned material data',()=>{
 it('keeps the source 2m scale on the terrain',()=>{const t=configureGroundTexture(new Texture(),'albedo',750,750);expect(t.repeat.toArray()).toEqual([375,375]);expect(t.wrapS).toBe(RepeatWrapping);expect(t.wrapT).toBe(RepeatWrapping);expect(t.colorSpace).toBe(SRGBColorSpace);t.dispose()});
 it('does not gamma-decode normals or roughness',()=>{for(const kind of ['normal','roughness'] as const){const t=configureGroundTexture(new Texture(),kind,10,20);expect(t.colorSpace).toBe(NoColorSpace);expect(t.repeat.toArray()).toEqual([5,10]);t.dispose()}});
});
