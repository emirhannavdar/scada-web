import {loadModel} from './model-loader';
import {modelUrl,removeReplaced} from './model-url';
import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {fitImported,replaceImported,trackImported} from './imported-models';
import {cityPlan} from './city-plan';
export const userModelFiles={solar_panel:modelUrl('solar_panel'),pete:modelUrl('pete'),simple_house:modelUrl('simple_house')};
export type UserModelKind=keyof typeof userModelFiles;
type Resources={geometries:Set<T.BufferGeometry>;materials:Set<T.Material>;maps:Set<T.Texture>};
export function poseWorkingPerson(model:T.Object3D,loading=false){
 model.updateMatrixWorld(true);for(const side of ['Left','Right']){const arm=model.getObjectsByProperty('isBone',true).find(b=>b.name.includes(side+'Arm_')),fore=model.getObjectsByProperty('isBone',true).find(b=>b.name.includes(side+'ForeArm_'));if(!arm||!fore)continue;model.updateMatrixWorld(true);const direction=fore.getWorldPosition(new T.Vector3()).sub(arm.getWorldPosition(new T.Vector3())).normalize(),down=new T.Vector3(side==='Left'?.07:-.07,loading?-.38:-1,loading?.8:.06).normalize(),world=arm.getWorldQuaternion(new T.Quaternion()).premultiply(new T.Quaternion().setFromUnitVectors(direction,down));const parent=arm.parent!.getWorldQuaternion(new T.Quaternion()).invert();arm.quaternion.copy(parent.multiply(world));model.updateMatrixWorld(true);}
}
/** A shared mesh is drawn once per material group, not once per panel/building. */
function instances(model:T.Object3D,parent:T.Object3D,placements:T.Matrix4[],name:string,resources:Resources){
 model.updateMatrixWorld(true);const out:T.InstancedMesh[]=[];model.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);resources.geometries.add(g);const mesh=new T.InstancedMesh(g,o.material,placements.length);placements.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.layers.mask=parent.layers.mask;parent.add(mesh);out.push(mesh)});return out;
}
const at=(x:number,y:number,z:number,rotation=0)=>new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rotation),new T.Vector3(1,1,1));
export function installUserModel(scene:T.Scene,kind:UserModelKind,gltf:GLTF,resources:Resources){
 trackImported(gltf.scene,resources);const installed:T.Object3D[]=[];
 if(kind==='solar_panel')return installed; // Table layout is authoritative; never overlay the six-module source rack.
 if(kind==='pete'){
  poseWorkingPerson(gltf.scene);for(const [i,name] of ['maintenance-worker-1','maintenance-worker-2'].entries()){const target=scene.getObjectByName(name)!;const person=clone(gltf.scene);if(i===0)poseWorkingPerson(person,true);const fitted=fitImported(person,i===0?1.78:1.82);if(i===0)fitted.rotation.x=.08;replaceImported(target,fitted,'imported-pete',0);installed.push(fitted);}
 }
 if(kind==='simple_house'){
  const city=scene.getObjectByName('night-city')!,fitted=fitImported(clone(gltf.scene),16.2,'x');
  const size=new T.Box3().setFromObject(fitted).getSize(new T.Vector3());fitted.scale.multiplyScalar(16.2/Math.max(size.x,size.z));
  const selected=cityPlan().filter(p=>p.kind==='villa'&&p.seed%3!==0);
  const batch=instances(fitted,city,selected.map(p=>at(p.x,0,p.z,p.seed%4*Math.PI/2)),'imported-residential-houses',resources);installed.push(...batch);
  for(const mesh of batch)selected.forEach((p,i)=>mesh.setColorAt(i,new T.Color(['#ffffff','#f0e3d5','#dce5df'][p.seed%3]!)));
  removeReplaced(scene,'procedural-villa-batch');
 }

 return installed;
}
export function loadUserModels(scene:T.Scene,resources:Resources,manager:T.LoadingManager,onError:()=>void,previous:Promise<void>,start:Promise<void>=Promise.resolve(),changed:()=>void=()=>{}){
 let disposed=false;const batches:T.InstancedMesh[]=[];const status:Record<string,string>={};scene.userData['userModels']=status;const loader=new GLTFLoader(manager);
 const ready=Promise.all((Object.keys(userModelFiles) as UserModelKind[]).filter(kind=>kind==='pete').map(async kind=>{try{await start;if(disposed)return;status[kind]='loading';const gltf=await loadModel(userModelFiles[kind],manager,kind==='pete'?5:6);if(disposed){const orphan:Resources={geometries:new Set(),materials:new Set(),maps:new Set()};trackImported(gltf.scene,orphan);orphan.geometries.forEach(g=>g.dispose());orphan.materials.forEach(m=>m.dispose());orphan.maps.forEach(t=>t.dispose());return}const result=installUserModel(scene,kind,gltf,resources);result.forEach(o=>{if(o instanceof T.InstancedMesh)batches.push(o)});status[kind]=result.length?'loaded':'target-missing';changed();}catch{status[kind]='failed';onError()}})).then(()=>{});
 return {ready,dispose(){disposed=true;batches.forEach(m=>m.dispose())}};
}
