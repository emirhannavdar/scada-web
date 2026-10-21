import * as T from 'three';
const base='/assets/materials/rocks-ground-01/';
export const scannedGroundAssets={albedo:base+'albedo.webp',normal:base+'normal-gl.png',roughness:base+'roughness.png'};
/** Poly Haven's 2m tile in physical world units; data maps never receive sRGB decoding. */
export function configureGroundTexture(texture:T.Texture,kind:keyof typeof scannedGroundAssets,width:number,depth:number){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(width/2,depth/2);texture.anisotropy=8;texture.colorSpace=kind==='albedo'?T.SRGBColorSpace:T.NoColorSpace;return texture;}
export function loadScannedGround(material:T.MeshStandardMaterial,maps:Set<T.Texture>,onError:()=>void,manager?:T.LoadingManager){
 const loader=new T.TextureLoader(manager);const pending=(Object.keys(scannedGroundAssets) as (keyof typeof scannedGroundAssets)[]).map(kind=>new Promise<void>(resolve=>{const t=loader.load(scannedGroundAssets[kind],texture=>{configureGroundTexture(texture,kind,750,750);if(kind==='albedo')material.map=texture;else if(kind==='normal'){material.normalMap=texture;material.normalScale.set(.65,.65);material.bumpMap=null;}else{material.roughnessMap=texture;material.roughness=1;}material.needsUpdate=true;resolve()},undefined,()=>{onError();resolve()});maps.add(t)}));return Promise.all(pending).then(()=>{});
}
