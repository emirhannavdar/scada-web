import {loadModel} from './model-loader';
import {modelUrl} from './model-url';
import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {ease} from './path';
export type ImportedKind='worker'|'walker'|'operator';
export const importedFiles:Record<ImportedKind,string>={worker:modelUrl('worker_hat'),walker:modelUrl('walker'),operator:modelUrl('operator')};
type Resources={geometries:Set<T.BufferGeometry>;materials:Set<T.Material>;maps:Set<T.Texture>};
export function trackImported(root:T.Object3D,r:Resources){root.traverse(o=>{if(!(o instanceof T.Mesh))return;r.geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){r.materials.add(m);for(const v of Object.values(m))if(v instanceof T.Texture){v.anisotropy=4;r.maps.add(v)}}o.castShadow=true;o.receiveShadow=true;});}
/** Fit using one uniform scale, preserve anatomical proportions and the original forward axis. */
export function fitImported(model:T.Object3D,size:number,axis:'x'|'y'='y',centerZ=true){model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),extent=bounds.getSize(new T.Vector3()),scale=size/extent[axis];if(!Number.isFinite(scale)||scale<=0)throw new Error('Invalid model bounds');const content=new T.Group();content.add(model);content.scale.setScalar(scale);content.position.set(-(bounds.min.x+bounds.max.x)*.5*scale,-bounds.min.y*scale,centerZ?-(bounds.min.z+bounds.max.z)*.5*scale:0);const wrapper=new T.Group();wrapper.add(content);return wrapper;}
export function replaceImported(target:T.Object3D,model:T.Object3D,name:string,layer:number){const old=[...target.children];model.name=name;model.traverse(o=>o.layers.set(layer));old.forEach(o=>o.removeFromParent());target.add(model);return model;}
export function installImported(scene:T.Scene,kind:ImportedKind,gltf:GLTF,r:Resources){
 trackImported(gltf.scene,r);const installed:T.Object3D[]=[];let mixer:T.AnimationMixer|undefined;
 const mount=(targetName:string,size:number,axis:'x'|'y'='y',centerZ=true)=>{const target=scene.getObjectByName(targetName);if(!target)return;const object=fitImported(clone(gltf.scene),size,axis,centerZ);trackImported(object,r);replaceImported(target,object,'imported-'+kind,targetName==='home-sofa'||targetName==='seated-operator'?2:0);installed.push(object);return object;};
 if(kind==='worker'){mount('maintenance-worker-1',1.78);const m=mount('maintenance-worker-2',1.82);if(m)m.rotation.y=.3;}
 if(kind==='walker'){const m=mount('walking-worker',1.78);if(m&&gltf.animations.length){mixer=new T.AnimationMixer(m);mixer.clipAction(gltf.animations[0]!).play();}}
 if(kind==='operator'){const m=mount('seated-operator',1.4,'y',false);if(m){m.position.set(20,.02,4.18);m.rotation.y=Math.PI;}}
 return {installed,mixer};
}
export function loadImportedModels(scene:T.Scene,r:Resources,onError:()=>void,manager?:T.LoadingManager,start:Promise<void>=Promise.resolve(),changed:()=>void=()=>{}){
 let disposed=false;const mixers:T.AnimationMixer[]=[];const prototypes:T.Object3D[]=[];const loaded=new Map<ImportedKind,GLTF>();const status:Record<string,string>={};scene.userData['importedModels']=status;const loader=new GLTFLoader(manager);
 const ready=Promise.all((Object.keys(importedFiles) as ImportedKind[]).map(async kind=>{try{await start;if(disposed)return;status[kind]='loading';const gltf=await loadModel(importedFiles[kind],manager,{worker:3,walker:4,operator:9}[kind]);if(disposed){const orphan:Resources={geometries:new Set(),materials:new Set(),maps:new Set()};trackImported(gltf.scene,orphan);orphan.geometries.forEach(x=>x.dispose());orphan.materials.forEach(x=>x.dispose());orphan.maps.forEach(x=>x.dispose());return}prototypes.push(gltf.scene);loaded.set(kind,gltf);const result=kind==='worker'?{installed:[] as T.Object3D[],mixer:undefined}:installImported(scene,kind,gltf,r);status[kind]=result.installed.length?'loaded':'target-missing';if(result.mixer)mixers.push(result.mixer);changed();}catch{status[kind]='failed';onError()}})).then(()=>{
  if(disposed)return;const source=loaded.get('worker')?.scene,walker=scene.getObjectByName('imported-walker');if(!source||!walker)return;
  fitWalkerHelmet(source,walker,r);loaded.clear();prototypes.length=0;changed();
 });
 return {ready,update(p:number){const distance=ease(p/.22)*10;for(const mixer of mixers)mixer.setTime(distance/1.7)},dispose(){disposed=true;mixers.forEach(m=>{m.stopAllAction();m.uncacheRoot(m.getRoot())});prototypes.length=0;}};
}

export function fitWalkerHelmet(source:T.Object3D,walker:T.Object3D,r:Resources){
  const head=walker.getObjectByName('head');if(!head)return;source.updateMatrixWorld(true);const shell=new T.Group();source.traverse(o=>{if(o instanceof T.Mesh&&(/hardhat/i.test(o.name)||o.name==='Cylinder')){const part=o.clone();part.matrix.copy(o.matrixWorld);part.matrix.decompose(part.position,part.quaternion,part.scale);shell.add(part)}});if(!shell.children.length)return;
  const b=new T.Box3().setFromObject(shell),offset=new T.Group();offset.add(shell);shell.position.set(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);walker.updateWorldMatrix(true,true);const crown=new T.Box3().setFromObject(walker).max.y,headCenter=head.getWorldPosition(new T.Vector3());offset.position.copy(walker.worldToLocal(new T.Vector3(headCenter.x,crown-.025,headCenter.z)));walker.add(offset);walker.updateWorldMatrix(true,true);head.attach(offset);offset.name='imported-walker-hardhat';offset.traverse(o=>o.layers.set(0));trackImported(offset,r);
 return walker.getObjectByName('imported-walker-hardhat');
}
