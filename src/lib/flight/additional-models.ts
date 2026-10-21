import {installFurniture,type FurnitureKind} from './residential-room';
import {loadModel} from './model-loader';
import {modelUrl} from './model-url';
import {installGamingRoom,installSmallVillas} from './living-models';
import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {fitImported,replaceImported,trackImported} from './imported-models';
import {installScannedSite,installGravelRoads,installApartments} from './site-models';
type Resources={geometries:Set<T.BufferGeometry>;materials:Set<T.Material>;maps:Set<T.Texture>};
export const additionalModelFiles={landscape:modelUrl('landscape'),service_pickup:modelUrl('service_pickup'),gravel_road:modelUrl('gravel_road_lod'),gravel_road_detail:modelUrl('gravel_road'),korean_apartment:modelUrl('korean_apartment'),small_villa:modelUrl('small_villa'),gaming_room:modelUrl('gaming_room'),furniture_sofa:modelUrl('furniture_sofa'),furniture_table:modelUrl('furniture_table'),furniture_desk:modelUrl('furniture_desk'),furniture_bookshelf:modelUrl('furniture_bookshelf')};
export function installAdditionalModel(scene:T.Scene,kind:string,gltf:GLTF,r:Resources){
 const source=clone(gltf.scene);trackImported(source,r);
 if(kind.startsWith('furniture_'))return [installFurniture(scene.getObjectByName('remote-home')!,kind as FurnitureKind,source,r)];
 if(kind==='gaming_room')return installGamingRoom(scene,source,r);
 if(kind==='small_villa')return installSmallVillas(scene,source,r);
 if(kind==='landscape')return installScannedSite(scene,source,r);
 if(kind==='gravel_road_detail')return installGravelRoads(scene,source,r,true);
 if(kind==='gravel_road')return installGravelRoads(scene,source,r);
 if(kind==='korean_apartment')return installApartments(scene,source,r);
 if(kind==='service_pickup'){const target=scene.getObjectByName('field-service-pickup')!,m=fitImported(source,5.4,'x');m.rotation.y=Math.PI/2;replaceImported(target,m,'imported-service_pickup',0);return [m];}
 return [];
}
export function loadAdditionalModels(scene:T.Scene,r:Resources,manager:T.LoadingManager,onError:()=>void,previous:Promise<void>,start:Promise<void>=Promise.resolve(),changed:()=>void=()=>{}){
 let lowRoadReady!:()=>void;const roadReady=new Promise<void>(resolve=>{lowRoadReady=resolve});
 let disposed=false;const batches:T.InstancedMesh[]=[];const status:Record<string,string>={};scene.userData['additionalModels']=status;const loader=new GLTFLoader(manager);
 const ready=Promise.all(Object.entries(additionalModelFiles).filter(([kind])=>kind!=='small_villa'&&kind!=='korean_apartment').map(async([kind,url])=>{try{await start;if(disposed)return;status[kind]='loading';const gltf=await loadModel(url,manager,({landscape:0,gravel_road:1,service_pickup:2,small_villa:7,korean_apartment:8,gaming_room:10,gravel_road_detail:11,furniture_desk:12,furniture_sofa:13,furniture_table:14,furniture_bookshelf:15} as Record<string,number>)[kind]??12);if(disposed){const orphan:Resources={geometries:new Set(),materials:new Set(),maps:new Set()};trackImported(gltf.scene,orphan);orphan.geometries.forEach(g=>g.dispose());orphan.materials.forEach(m=>m.dispose());orphan.maps.forEach(t=>t.dispose());return;}if(kind==='gravel_road_detail')await roadReady;if(disposed)return;const result=installAdditionalModel(scene,kind,gltf,r);if(kind==='gravel_road')lowRoadReady();for(const o of result)if(o instanceof T.InstancedMesh)batches.push(o);status[kind]=result.length?'loaded':'target-missing';changed();}catch{if(kind==='gravel_road')lowRoadReady();status[kind]='failed';onError();}})).then(()=>{});
 return {ready,dispose(){disposed=true;batches.forEach(m=>m.dispose());}};
}
